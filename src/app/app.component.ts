import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="spotlight-overlay" [ngStyle]="{'--sx.px': spotlightX, '--sy.px': spotlightY}"></div>
  <form (ngSubmit)="submit()" #form="ngForm">
    <h1 #header class="revealed">Firewall Request Form</h1>

    <label [class.revealed]="revealed.has('src')">Field 1a: Source IP address</label>
    <input name="src" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="src" (click)="reveal('src')" />

    <label [class.revealed]="revealed.has('src2')">Field 1b: Confirm source IP address</label>
    <input name="src2" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="src2" (keydown)="transform($event,2)" (click)="reveal('src2'); activateGhost($event)" />

    <label [class.revealed]="revealed.has('dest')">Field 2a: Destination IP address</label>
    <input name="dest" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="dest" (click)="reveal('dest')" />

    <label [class.revealed]="revealed.has('dest2')">Field 2b: Confirm Destination IP address</label>
    <input name="dest2" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="dest2" (keydown)="transform($event,4)" (click)="reveal('dest2'); activateGhost($event)" />

    <label [class.revealed]="revealed.has('dest3')">Field 3: Destination IP address</label>
    <input name="dest3" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="dest3" (click)="reveal('dest3')" />

    <label [class.revealed]="revealed.has('mac')">Field 4: MAC Address of your first computer</label>
    <input name="mac" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="mac" (click)="reveal('mac')" />

    <label [class.revealed]="revealed.has('modem')">Field 5: IP address of your first 56k baud modem</label>
    <input name="modem" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="modem" (click)="reveal('modem')" />

    <label [class.revealed]="revealed.has('field6')">Field 6:</label>
    <input name="field6" class="mushroom" required pattern="[0-9.]*" [(ngModel)]="field6" (click)="reveal('field6')" />

    <button type="submit" class="submit-btn" [ngStyle]="{left: submitX+'px', top: submitY+'px'}" (mouseenter)="hoverSubmit=true" (mouseleave)="hoverSubmit=false" [class.bowser]="hoverSubmit">Submit</button>

    <div class="error" *ngIf="error">{{error}}</div>
  </form>

  <img src="assets/ghost.svg" class="ghost" #ghost [ngStyle]="{left: ghostX+'px', top: ghostY+'px', display: ghostVisible ? 'block':'none'}" />
  <img src="assets/dead-mario.svg" class="dead-mario" #dead [ngStyle]="{left: deadX+'px', top: deadY+'px', display: deadVisible ? 'block':'none'}" />
  <audio #bg loop src="assets/background.mp3"></audio>
  <audio #deadSound src="assets/dead.mp3"></audio>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'ghost-form';
  spotlightX = 200;
  spotlightY = 50;
  submitX = 200;
  submitY = 300;
  ghostX = 0;
  ghostY = 0;
  deadX = 0;
  deadY = 0;
  ghostVisible = false;
  deadVisible = false;
  hoverSubmit = false;
  revealed = new Set<string>();

  src=''; src2=''; dest=''; dest2=''; dest3=''; mac=''; modem=''; field6='';
  error='';

  @ViewChild('header') header!: ElementRef;
  @ViewChild('ghost') ghost!: ElementRef<HTMLImageElement>;
  @ViewChild('dead') dead!: ElementRef<HTMLImageElement>;
  @ViewChild('bg') bg!: ElementRef<HTMLAudioElement>;
  @ViewChild('deadSound') deadSound!: ElementRef<HTMLAudioElement>;

  ngOnInit() {
    setTimeout(() => {
      this.moveSpotlight();
      this.moveSubmit();
      this.bg.nativeElement.play().catch(()=>{});
      setInterval(() => this.moveSpotlight(), 3000);
      setInterval(() => this.moveSubmit(), 3000);
    }, 3000);
    setTimeout(() => {
      const rect = this.header.nativeElement.getBoundingClientRect();
      this.spotlightX = rect.left + rect.width/2;
      this.spotlightY = rect.top + rect.height/2;
    });
  }

  reveal(field: string) { this.revealed.add(field); }

  transform(event: KeyboardEvent, add: number) {
    const input = event.target as HTMLInputElement;
    const key = event.key;
    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      const num = (parseInt(key,10) + add) % 10;
      input.value += num.toString();
      if (input.name === 'src2') this.src2 = input.value;
      if (input.name === 'dest2') this.dest2 = input.value;
    } else if (key === 'Backspace') {
      setTimeout(() => {
        if (input.name === 'src2') this.src2 = input.value;
        if (input.name === 'dest2') this.dest2 = input.value;
      });
    } else if (key === '.') {
      // allow dot
    } else {
      event.preventDefault();
    }
  }

  activateGhost(event: Event) {
    const input = event.target as HTMLElement;
    const rect = input.getBoundingClientRect();
    this.ghostX = 0;
    this.ghostY = 0;
    this.ghostVisible = true;
    const targetX = rect.left;
    const targetY = rect.top;
    const interval = setInterval(() => {
      if (!this.ghostVisible) { clearInterval(interval); return; }
      this.ghostX += Math.sign(targetX - this.ghostX);
      this.ghostY += Math.sign(targetY - this.ghostY);
      const ghostRect = {left:this.ghostX, top:this.ghostY, right:this.ghostX+50, bottom:this.ghostY+50};
      if (ghostRect.right > rect.left && ghostRect.left < rect.right && ghostRect.bottom > rect.top && ghostRect.top < rect.bottom) {
        clearInterval(interval);
        this.deadX = rect.left;
        this.deadY = rect.top;
        this.deadVisible = true;
        this.deadSound.nativeElement.play().catch(()=>{});
        setTimeout(() => { this.deadVisible = false; this.reset(); }, 2000);
      }
    }, 30);
  }

  reset() {
    this.src=this.src2=this.dest=this.dest2=this.dest3=this.mac=this.modem=this.field6='';
    this.error='';
    this.revealed.clear();
    this.ghostVisible=false;
    const rect = this.header.nativeElement.getBoundingClientRect();
    this.spotlightX = rect.left + rect.width/2;
    this.spotlightY = rect.top + rect.height/2;
  }

  moveSpotlight() {
    this.spotlightX = Math.random() * window.innerWidth;
    this.spotlightY = Math.random() * window.innerHeight;
  }

  moveSubmit() {
    this.submitX = Math.random() * (window.innerWidth - 100);
    this.submitY = Math.random() * (window.innerHeight - 50);
  }

  submit() {
    if (this.src !== this.src2 || this.dest !== this.dest2) {
      this.deadSound.nativeElement.play().catch(()=>{});
      this.error = 'Fields 1a/1b or 2a/2b do not match.';
      return;
    }
    if (!confirm("The MAC address and modem IP don't check out. Request will be denied. Submit anyway?")) return;
    alert("Form submitted. We'll get back to you when.... \n🐖    🐖    🐖");
  }
}
