import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <!-- Always-visible mute button -->
  <div class="volume-control">
    <button (click)="toggleMute()">{{ muted ? 'Unmute' : 'Mute' }}</button>
  </div>

  <!-- Always-visible volume control -->
  <div class="volume-control">
    <input type="range" min="0" max="200" [value]="volumePct" (input)="setVolume($event)" />
  </div>

  <div class="spotlight-overlay" [ngStyle]="{'--sx.px': spotlightX, '--sy.px': spotlightY}"></div>
  <form (ngSubmit)="submit()" #form="ngForm" autocomplete="off">
    <img #header src="assets/firewall-header.png" alt="Firewall Request Form" class="header-image">

    <div class="field" [ngStyle]="pos('src')">
      <label [class.revealed]="revealed.has('src')">Source IP address</label>
      <input name="src" required pattern="[0-9.]*" autocomplete="off"
             [(ngModel)]="src" (click)="reveal('src')" (focus)="startChase('src')" (blur)="stopChase()"
             [class.revealed]="revealed.has('src')" />
    </div>

    <div class="field" [ngStyle]="pos('dest')">
      <label [class.revealed]="revealed.has('dest')">Destination IP address</label>
      <input name="dest" required pattern="[0-9.]*" autocomplete="off"
             [(ngModel)]="dest" (click)="reveal('dest')" (focus)="startChase('dest')" (blur)="stopChase()"
             [class.revealed]="revealed.has('dest')" />
    </div>

    <div class="field" [ngStyle]="pos('mac')">
      <label [class.revealed]="revealed.has('mac')">MAC Address of your first computer</label>
      <input name="mac" required pattern="[0-9.]*" autocomplete="off"
             [(ngModel)]="mac" (click)="reveal('mac')" (focus)="startChase('mac')" (blur)="stopChase()"
             [class.revealed]="revealed.has('mac')" />
    </div>

    <div class="field" [ngStyle]="pos('modem')">
      <label [class.revealed]="revealed.has('modem')">IP address of your first 56k baud modem</label>
      <input name="modem" required pattern="[0-9.]*" autocomplete="off"
             [(ngModel)]="modem" (click)="reveal('modem')" (focus)="startChase('modem')" (blur)="stopChase()"
             [class.revealed]="revealed.has('modem')" />
    </div>

    <button #submitBtn type="submit" class="submit-btn" [ngStyle]="{left: submitX+'px', top: submitY+'px'}"
            (mouseenter)="pauseSubmit()" (mouseleave)="resumeSubmit()">Submit</button>
  </form>

  <img src="assets/ghost.png" class="ghost" #ghost [ngStyle]="{left: ghostX+'px', top: ghostY+'px', display: ghostVisible ? 'block':'none'}" />
  <img src="assets/dead-mario.png" class="dead-mario" #dead [ngStyle]="{left: deadX+'px', top: deadY+'px', display: deadVisible ? 'block':'none'}" />
  <div class="game-over" *ngIf="gameOver">
    <div>No Firewall for you!</div>
    <button (click)="tryAgain()">Try Again?</button>
  </div>
  <div class="pigs-popup" *ngIf="pigsPopup">
    <div>Form submitted. We'll get back to you when...</div>
    <img src="assets/pigs-flying.gif" alt="Pigs flying" />
    <button (click)="pigsPopup=false">Close</button>
  </div>
  <audio #bg loop src="assets/background.mp3"></audio>
  <audio #deadSound src="assets/dead.mp3"></audio>
  `,
  styles: []
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ghost-form';
  spotlightX = 200;
  spotlightY = 50;
  submitX = 200;
  submitY = 300;
  ghostX = 0;
  ghostY = 0;
  deadX = 0;
  deadY = 0;
  ghostVisible = true;
  deadVisible = false;
  hoverSubmit = false;
  ghostSpeed = 1.2;
  revealed = new Set<string>();
  fieldPositions: {[key:string]: {x:number, y:number}} = {};
  chaseInterval: any;
  targetField: string | null = null;
  submitTimer: any;
  gameOver = false;
  pigsPopup = false;

  src=''; dest=''; mac=''; modem='';
  // Revert to simple element volume (0..1)
  volumePct = 200; // 0-200 for up to 200% loudness

  muted = false;

  private audioCtx?: AudioContext;
  private gainNode?: GainNode;
  private bgSource?: MediaElementAudioSourceNode;
  private deadSource?: MediaElementAudioSourceNode;

  @ViewChild('header') header!: ElementRef;
  @ViewChild('ghost') ghost!: ElementRef<HTMLImageElement>;
  @ViewChild('dead') dead!: ElementRef<HTMLImageElement>;
  @ViewChild('bg') bg!: ElementRef<HTMLAudioElement>;
  @ViewChild('deadSound') deadSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('submitBtn') submitBtn!: ElementRef<HTMLButtonElement>;

  ngOnInit() {
    this.randomizeFields();
    this.ghostX = window.innerWidth/2 - 25;
    this.ghostY = window.innerHeight/2 - 25;
  }

  ngAfterViewInit() {
    const rect = this.header.nativeElement.getBoundingClientRect();
    this.spotlightX = rect.left + rect.width/2;
    this.spotlightY = rect.top + rect.height/2;

    this.bg.nativeElement.volume = 1;
    this.deadSound.nativeElement.volume = 1;

    // Try to play sound immediately and retry for 5 seconds
    let playAttempts = 0;
    const playInterval = setInterval(() => {
      this.bg.nativeElement.play().catch(() => {});
      playAttempts++;
      if (playAttempts >= 10) clearInterval(playInterval);
    }, 500);

    // Also start music and unmute if user clicks anywhere on the screen
    window.addEventListener('click', () => {
      if (this.muted) {
        this.muted = false;
        this.bg.nativeElement.volume = 1;
        this.deadSound.nativeElement.volume = 1;
      }
      this.bg.nativeElement.play().catch(() => {});
    });

    setTimeout(() => {
      this.moveSpotlight();
      this.moveSubmit();
      this.scheduleSubmitMove();
      setInterval(() => this.moveSpotlight(), 3000);
    }, 3000);
  }

  reveal(field: string) { this.revealed.add(field); }

  startChase(field: string) {
    this.targetField = field;
    if (!this.chaseInterval) {
      this.chaseInterval = setInterval(() => {
        if (!this.targetField) return;
        const rect = this.getRect(this.targetField);
        const dx = rect.left - this.ghostX;
        const dy = rect.top - this.ghostY;
        this.ghostX += Math.sign(dx) * this.ghostSpeed;
        this.ghostY += Math.sign(dy) * this.ghostSpeed;
        this.ghost.nativeElement.style.transform = dx < 0 ? 'scaleX(-1)' : 'scaleX(1)';
        const ghostRect = {left:this.ghostX, top:this.ghostY, right:this.ghostX+50, bottom:this.ghostY+50};
        if (ghostRect.right > rect.left && ghostRect.left < rect.right &&
            ghostRect.bottom > rect.top && ghostRect.top < rect.bottom) {
          this.stopChase();
          this.deadX = rect.left;
          this.deadY = rect.top;
          this.deadVisible = true;
          this.ghostVisible = false;
          this.bg.nativeElement.pause();
          this.deadSound.nativeElement.currentTime = 0;
          this.deadSound.nativeElement.play().catch(()=>{});
          setTimeout(() => { this.gameOver = true; }, 2000);
        }
      }, 20);
    }
  }

  stopChase() {
    if (this.chaseInterval) clearInterval(this.chaseInterval);
    this.chaseInterval = undefined;
    this.targetField = null;
  }

  getRect(field: string): DOMRect {
    const el = document.querySelector(`input[name="${field}"]`) as HTMLElement;
    return el.getBoundingClientRect();
  }

  randomizeFields() {
    const w = window.innerWidth - 200;
    const h = window.innerHeight - 200;
    const placed: {x:number, y:number}[] = [];
    const collides = (x:number, y:number) => placed.some(p => Math.abs(p.x - x) < 200 && Math.abs(p.y - y) < 60);
    const place = (key:string) => {
      let x=0, y=0;
      do {
        x = Math.random()*w;
        y = Math.random()*h;
      } while (collides(x,y));
      this.fieldPositions[key] = {x,y};
      placed.push({x,y});
    };
    ['src','dest','mac','modem'].forEach(place);
  }

  pos(field: string) {
    const p = this.fieldPositions[field];
    return {left: p?.x + 'px', top: p?.y + 'px'};
  }

  moveSpotlight() {
    this.spotlightX = Math.random() * window.innerWidth;
    this.spotlightY = Math.random() * window.innerHeight;
  }

  moveSubmit() {
    this.submitX = Math.random() * (window.innerWidth - 100);
    this.submitY = Math.random() * (window.innerHeight - 50);
  }

  scheduleSubmitMove(delay: number = 3000) {
    this.submitTimer = setTimeout(() => {
      if (!this.hoverSubmit) this.moveSubmit();
      this.scheduleSubmitMove();
    }, delay);
  }

  pauseSubmit() {
    this.hoverSubmit = true;
    if (this.submitTimer) clearTimeout(this.submitTimer);
    const btn = this.submitBtn.nativeElement;
    const rect = btn.getBoundingClientRect();
    btn.style.transition = 'none';
    this.submitX = rect.left;
    this.submitY = rect.top;
  }

  resumeSubmit() {
    this.hoverSubmit = false;
    this.submitBtn.nativeElement.style.transition = '';
    this.scheduleSubmitMove(2000);
  }

  setVolume(e: Event) {
    const val = (e.target as HTMLInputElement).valueAsNumber;
    this.volumePct = Math.min(200, Math.max(0, val));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volumePct / 100;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.bg.nativeElement.volume = this.muted ? 0 : 1;
    this.deadSound.nativeElement.volume = this.muted ? 0 : 1;
    if (!this.muted) {
      this.bg.nativeElement.play().catch(() => {});
    }
  }

  submit() {
    if (!this.src || !this.dest || !this.mac || !this.modem) {
      alert('all fields need filled out');
      return;
    }
    if (!confirm("The MAC address and modem IP don't check out. Request will be denied. Submit anyway?")) return;
    this.pigsPopup = true;
  }

  reset() {
    this.stopChase();
    this.src = this.dest = this.mac = this.modem = '';
    this.revealed.clear();
    this.randomizeFields();
    this.ghostX = window.innerWidth/2 - 25;
    this.ghostY = window.innerHeight/2 - 25;
    this.ghostVisible = true;
    const rect = this.header.nativeElement.getBoundingClientRect();
    this.spotlightX = rect.left + rect.width/2;
    this.spotlightY = rect.top + rect.height/2;
  }

  tryAgain() {
    window.location.reload();
  }
}
