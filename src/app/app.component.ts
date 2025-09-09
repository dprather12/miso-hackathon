import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="spotlight-overlay" [ngStyle]="{'--sx.px': spotlightX, '--sy.px': spotlightY}"></div>
  <form (ngSubmit)="submit()" #form="ngForm" autocomplete="off">
    <img #header src="assets/firewall-header.svg" alt="Firewall Request Form" class="header-image">

    <div class="field" [ngStyle]="pos('src')">
      <label [class.revealed]="revealed.has('src')">Source IP address</label>
      <input name="src" class="mushroom" required pattern="[0-9.]*" autocomplete="off" [(ngModel)]="src" (click)="reveal('src')" [class.revealed]="revealed.has('src')" />
    </div>

    <div class="field" [ngStyle]="pos('src2')">
      <label [class.revealed]="revealed.has('src2')">Confirm source IP address</label>
      <input name="src2" class="mushroom" required pattern="[0-9.]*" autocomplete="off" [(ngModel)]="src2" (keydown)="transform($event,2)" (click)="reveal('src2')" [class.revealed]="revealed.has('src2')" />
    </div>

    <div class="field" [ngStyle]="pos('dest')">
      <label [class.revealed]="revealed.has('dest')">Destination IP address</label>
      <input name="dest" class="mushroom" required pattern="[0-9.]*" autocomplete="off" [(ngModel)]="dest" (click)="reveal('dest')" [class.revealed]="revealed.has('dest')" />
    </div>

    <div class="field" [ngStyle]="pos('dest2')">
      <label [class.revealed]="revealed.has('dest2')">Confirm destination IP address</label>
      <input name="dest2" class="mushroom" required pattern="[0-9.]*" autocomplete="off" [(ngModel)]="dest2" (keydown)="transform($event,4)" (click)="reveal('dest2')" [class.revealed]="revealed.has('dest2')" />
    </div>

    <div class="field" [ngStyle]="pos('mac')">
      <label [class.revealed]="revealed.has('mac')">MAC Address of your first computer</label>
      <input name="mac" class="mushroom" required pattern="[0-9.]*" autocomplete="off" [(ngModel)]="mac" (click)="reveal('mac')" [class.revealed]="revealed.has('mac')" />
    </div>

    <div class="field" [ngStyle]="pos('modem')">
      <label [class.revealed]="revealed.has('modem')">IP address of your first 56k baud modem</label>
      <input name="modem" class="mushroom" required pattern="[0-9.]*" autocomplete="off" [(ngModel)]="modem" (click)="reveal('modem')" [class.revealed]="revealed.has('modem')" />
    </div>

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
  ghostVisible = true;
  deadVisible = false;
  hoverSubmit = false;
  revealed = new Set<string>();
  fieldPositions: {[key:string]: {x:number, y:number}} = {};

  src=''; src2=''; dest=''; dest2=''; mac=''; modem='';
  error='';

  @ViewChild('header') header!: ElementRef;
  @ViewChild('ghost') ghost!: ElementRef<HTMLImageElement>;
  @ViewChild('dead') dead!: ElementRef<HTMLImageElement>;
  @ViewChild('bg') bg!: ElementRef<HTMLAudioElement>;
  @ViewChild('deadSound') deadSound!: ElementRef<HTMLAudioElement>;

  ngOnInit() {
    this.randomizeFields();
    setTimeout(() => {
      this.moveSpotlight();
      this.moveSubmit();
      this.bg.nativeElement.play().catch(()=>{});
      setInterval(() => this.moveSpotlight(), 3000);
      setInterval(() => { if (!this.hoverSubmit) this.moveSubmit(); }, 3000);
    }, 3000);
    setTimeout(() => {
      const rect = this.header.nativeElement.getBoundingClientRect();
      this.spotlightX = rect.left + rect.width/2;
      this.spotlightY = rect.top + rect.height/2;
    });
    this.wanderGhost();
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

  chasing = false;

  wanderGhost() {
    setInterval(() => {
      if (this.chasing) return;
      this.ghostX = (this.ghostX + Math.random()*10 - 5 + window.innerWidth) % window.innerWidth;
      this.ghostY = (this.ghostY + Math.random()*10 - 5 + window.innerHeight) % window.innerHeight;
      const src2Rect = this.getRect('src2');
      const dest2Rect = this.getRect('dest2');
      if (this.inRect(this.ghostX, this.ghostY, src2Rect)) this.chase(src2Rect);
      else if (this.inRect(this.ghostX, this.ghostY, dest2Rect)) this.chase(dest2Rect);
    }, 100);
  }

  chase(rect: DOMRect) {
    this.chasing = true;
    const interval = setInterval(() => {
      if (!this.ghostVisible) { clearInterval(interval); return; }
      this.ghostX += Math.sign(rect.left - this.ghostX);
      this.ghostY += Math.sign(rect.top - this.ghostY);
      const ghostRect = {left:this.ghostX, top:this.ghostY, right:this.ghostX+50, bottom:this.ghostY+50};
      if (ghostRect.right > rect.left && ghostRect.left < rect.right && ghostRect.bottom > rect.top && ghostRect.top < rect.bottom) {
        clearInterval(interval);
        this.deadX = rect.left;
        this.deadY = rect.top;
        this.deadVisible = true;
        this.ghostVisible = false;
        this.deadSound.nativeElement.play().catch(()=>{});
        this.chasing = false;
        setTimeout(() => { this.deadVisible = false; this.reset(); }, 2000);
      }
    }, 30);
  }

  inRect(x: number, y: number, rect: DOMRect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  getRect(field: string): DOMRect {
    const el = document.querySelector(`input[name="${field}"]`) as HTMLElement;
    return el.getBoundingClientRect();
  }

  reset() {
    this.src=this.src2=this.dest=this.dest2=this.mac=this.modem='';
    this.error='';
    this.revealed.clear();
    this.ghostVisible=true;
    this.chasing=false;
    const rect = this.header.nativeElement.getBoundingClientRect();
    this.spotlightX = rect.left + rect.width/2;
    this.spotlightY = rect.top + rect.height/2;
    this.randomizeFields();
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
    place('src');
    this.fieldPositions['src2'] = {x: this.fieldPositions['src'].x, y: this.fieldPositions['src'].y + 60};
    placed.push(this.fieldPositions['src2']);
    place('dest');
    this.fieldPositions['dest2'] = {x: this.fieldPositions['dest'].x, y: this.fieldPositions['dest'].y + 60};
    placed.push(this.fieldPositions['dest2']);
    ['mac','modem'].forEach(place);
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
    if (this.hoverSubmit) return;
    this.submitX = Math.random() * (window.innerWidth - 100);
    this.submitY = Math.random() * (window.innerHeight - 50);
  }

  submit() {
    if (this.src !== this.src2 || this.dest !== this.dest2) {
      this.deadSound.nativeElement.play().catch(()=>{});
      this.error = 'Source or destination fields do not match.';
      return;
    }
    if (!confirm("The MAC address and modem IP don't check out. Request will be denied. Submit anyway?")) return;
    alert("Form submitted. We'll get back to you when.... \n🐖    🐖    🐖");
  }
}
