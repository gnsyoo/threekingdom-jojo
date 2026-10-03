import Phaser from 'phaser';
import { getScenario, type Scenario, type ScenarioId } from './scenarios.ts';
import { key, inBounds, reachable as movementRange, findUnit, type BattleState, type Point, type Reachable, type Hit, type Unit } from './core.ts';

export const TILE = 64;
export type MapMode = 'inspect' | 'move' | 'attack';
export interface MapPresentation {
  state: BattleState; selectedId: string; mode: MapMode;
  reachable: Reachable[]; preview: Point[]; target: Point | null; grid: boolean; fast: boolean; threat:boolean;
}
interface MotionAtlas { units: { scale: number; texture?:string; frames: { x:number; y:number; width:number; height:number; pivotX:number; pivotY:number }[] }[] }
export class BattleScene extends Phaser.Scene {
  onTile: (point: Point) => void = () => {};
  onReady: () => void = () => {};
  private overlay!: Phaser.GameObjects.Graphics;
  private nodes = new Map<string, Phaser.GameObjects.Container>();
  private positions = new Map<string, Point>();
  private fire: Phaser.GameObjects.Graphics | null = null;
  private current: MapPresentation | null = null;
  private pointerStart = { x: 0, y: 0 }; private lastPointer = { x: 0, y: 0 };
  private dragged = false; private pinch = 0; private pinchUntil = 0;
  private ready = false; private overview = false;
  private motionData!: Record<'walk'|'attack',MotionAtlas>;
  private activeWalks = new Set<string>();
  private pendingHitSequences = 0;
  private visualUntil = 0;
  private retiring = new Set<string>();
  private counts = { walks:0, attacks:0, impacts:0 };
  private motionFrames: { id:string; kind:string; frame:string|number }[] = [];

  private readonly scenario:Scenario;
  constructor(scenarioId:ScenarioId='yeongcheon') { super('battle');this.scenario=getScenario(scenarioId); }
  preload() {
    this.load.image('ground', `${import.meta.env.BASE_URL}assets/${this.scenario.background}`);
    this.load.image('troops', `${import.meta.env.BASE_URL}assets/units.png`);
    this.load.image('walk', `${import.meta.env.BASE_URL}assets/units-walk.png`);
    this.load.image('attack', `${import.meta.env.BASE_URL}assets/units-attack.png`);
    if(this.scenario.id!=='yeongcheon'){this.load.image('boss-motion',`${import.meta.env.BASE_URL}assets/boss-motion.png`);this.load.json('boss-data',`${import.meta.env.BASE_URL}assets/boss-motion.json`);}
    this.load.json('unit-motion', `${import.meta.env.BASE_URL}assets/unit-motion.json`);
  }
  create() {
    const atlas = this.textures.get('troops');
    const source = atlas.getSourceImage() as HTMLImageElement;
    const w = source.width / 4, h = source.height / 2;
    for (let i = 0; i < 8; i++) atlas.add(`unit-${i}`, 0, (i % 4) * w, Math.floor(i / 4) * h, w, h);
    this.motionData = this.cache.json.get('unit-motion');
    if(this.scenario.id!=='yeongcheon'){const extras=this.cache.json.get('boss-data');for(const id of [8,9])for(const kind of ['walk','attack'] as const)this.motionData[kind].units[id]={...extras[id][kind],texture:'boss-motion'};}
    for (const kind of ['walk','attack'] as const) {
      this.motionData[kind].units.forEach((unit,index)=>{
        const textureKey=unit.texture??kind,texture=this.textures.get(textureKey),frameName=(pose:number)=>unit.texture?`${kind}-${index}-${pose}`:`${index}-${pose}`;
        unit.frames.forEach((rect,pose)=>{
          const frame=texture.add(frameName(pose),0,rect.x,rect.y,rect.width,rect.height);
          if(frame){frame.customPivot=true;frame.pivotX=rect.pivotX;frame.pivotY=rect.pivotY;}
        });
        this.anims.create({key:`${kind}-${index}`,frames:unit.frames.map((_f,pose)=>({key:textureKey,frame:frameName(pose)})),frameRate:kind==='walk'?12:10,repeat:kind==='walk'?-1:0,skipMissedFrames:false});
      });
    }
    this.add.image(0, 0, 'ground').setOrigin(0).setDisplaySize(this.scenario.cols * TILE, this.scenario.rows * TILE).setTint(0xaebaaa);
    const marker = this.add.graphics();
    const landmark=this.scenario.landmark;
    marker.lineStyle(2, 0xb9dcaa, .55).strokeCircle((landmark.x+.5)*TILE,(landmark.y+.5)*TILE,15);
    this.add.text((landmark.x+.5)*TILE,(landmark.y+.5)*TILE-30,landmark.name, { fontFamily: 'serif', fontSize: '13px', color: '#edf4cc', stroke: '#233221', strokeThickness: 3 }).setOrigin(.5);
    this.overlay = this.add.graphics().setDepth(2);
    this.ready = true; this.configureCamera(true);
    this.scale.on('resize', () => this.configureCamera(false));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointerStart = { x: p.x, y: p.y }; this.lastPointer = { x: p.x, y: p.y }; this.dragged = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || this.pinch) return;
      if (Math.hypot(p.x - this.pointerStart.x, p.y - this.pointerStart.y) > 7) this.dragged = true;
      if (this.dragged) { this.cameras.main.scrollX -= (p.x - this.lastPointer.x) / this.cameras.main.zoom; this.cameras.main.scrollY -= (p.y - this.lastPointer.y) / this.cameras.main.zoom; }
      this.lastPointer = { x: p.x, y: p.y };
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.dragged || this.pinch || performance.now() < this.pinchUntil) return;
      const point = this.cameras.main.getWorldPoint(p.x, p.y);
      this.onTile({ x: Math.floor(point.x / TILE), y: Math.floor(point.y / TILE) });
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.zoom(dy > 0 ? -.08 : .08));
    const canvas = this.game.canvas;
    canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) this.pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      if (e.touches.length !== 2 || !this.pinch) return;
      e.preventDefault(); const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      this.zoom(this.cameras.main.zoom * (d / this.pinch - 1)); this.pinch = d;
    }, { passive: false });
    canvas.addEventListener('touchend', () => { if (this.pinch) { this.pinch = 0; this.pinchUntil = performance.now() + 300; } });
    this.onReady();
  }
  private configureCamera(initial: boolean) {
    const camera = this.cameras.main;
    const center=camera.midPoint.clone();
    const portrait=window.matchMedia('(orientation:portrait) and (max-width:900px)').matches;
    const fit = Math.min(this.scale.width / (this.scenario.cols * TILE), this.scale.height / (this.scenario.rows * TILE));
    const cover = Math.max(this.scale.width / (this.scenario.cols * TILE), this.scale.height / (this.scenario.rows * TILE));
    camera.setZoom(this.overview ? fit : portrait ? .78 : Math.max(cover,this.scale.width<850?.73:.75));
    this.updateBounds();
    const cao = this.current?.state.units.find(u => u.id === 'cao');
    if(this.overview)camera.centerOn(this.scenario.cols*TILE/2,this.scenario.rows*TILE/2);
    else if(initial&&(portrait||this.scale.height<440)&&cao)this.centerOn(cao);
    else if(initial)camera.centerOn(this.scenario.cols*TILE/2,this.scenario.rows*TILE/2);
    else camera.centerOn(center.x,center.y);
  }
  zoom(delta: number) {
    if (!this.ready) return;
    const camera = this.cameras.main;
    const center = camera.midPoint.clone();
    this.overview = false; camera.setZoom(Phaser.Math.Clamp(camera.zoom + delta, .28, 1.65)); this.updateBounds(); camera.centerOn(center.x, center.y);
  }
  private updateBounds() {
    const c = this.cameras.main, w = this.scenario.cols * TILE, h = this.scenario.rows * TILE;
    const visibleW = c.width / c.zoom, visibleH = c.height / c.zoom;
    c.setBounds(Math.min(0, (w - visibleW) / 2), Math.min(0, (h - visibleH) / 2), Math.max(w, visibleW), Math.max(h, visibleH));
  }
  toggleOverview() { this.overview = !this.overview; this.configureCamera(true); }
  centerOn(p: Point) { if (this.ready) this.cameras.main.centerOn((p.x + .5) * TILE, (p.y + .5) * TILE); }
  tileToScreen(p: Point): Point {
    const c = this.cameras.main, r = this.game.canvas.getBoundingClientRect();
    const centerX = c.scrollX + c.width / 2, centerY = c.scrollY + c.height / 2;
    return { x: r.left + c.width / 2 + ((p.x + .5) * TILE - centerX) * c.zoom, y: r.top + c.height / 2 + ((p.y + .5) * TILE - centerY) * c.zoom };
  }
  present(data: MapPresentation) {
    this.current = data; if (!this.ready) return;
    const { state, mode, selectedId, target, preview, reachable, grid } = data;
    const g = this.overlay; g.clear();
    if (grid) {
      g.lineStyle(1, 0xf4e9bd, .12);
      for (let x = 0; x <= this.scenario.cols; x++) g.lineBetween(x * TILE, 0, x * TILE, this.scenario.rows * TILE);
      for (let y = 0; y <= this.scenario.rows; y++) g.lineBetween(0, y * TILE, this.scenario.cols * TILE, y * TILE);
    }
    if (mode === 'move') {
      for (const p of reachable) { g.fillStyle(0x438fc4, .25).fillRect(p.x * TILE + 1, p.y * TILE + 1, TILE - 2, TILE - 2); g.lineStyle(1, 0x8fceef, .65).strokeRect(p.x * TILE + 1, p.y * TILE + 1, TILE - 2, TILE - 2); }
    }
    if(data.threat){
      const danger=new Set<string>();
      for(const boss of state.units.filter(u=>u.boss&&u.hp>0)){
        const positions=boss.id==='lubu'&&state.round<3?[boss]:movementRange(state,boss);
        for(const position of positions)for(let dy=-boss.range[1];dy<=boss.range[1];dy++)for(let dx=-boss.range[1];dx<=boss.range[1];dx++){
          const point={x:position.x+dx,y:position.y+dy},distance=Math.abs(dx)+Math.abs(dy);
          if(inBounds(point,state.scenarioId)&&distance>=boss.range[0]&&distance<=boss.range[1])danger.add(key(point));
        }
      }
      for(const point of danger){const [x,y]=point.split(',').map(Number);g.fillStyle(0xc45550,.2).fillRect(x*TILE+1,y*TILE+1,TILE-2,TILE-2);g.lineStyle(1,0xe1a176,.45).strokeRect(x*TILE+1,y*TILE+1,TILE-2,TILE-2);}
    }
    const actor = state.units.find(u => u.id === 'cao')!;
    if (mode === 'attack' && !actor.acted && state.phase === 'player') {
      for (const p of [{ x: actor.x + 1, y: actor.y }, { x: actor.x - 1, y: actor.y }, { x: actor.x, y: actor.y + 1 }, { x: actor.x, y: actor.y - 1 }]) {
        g.fillStyle(0xc46545, .22).fillRect(p.x * TILE + 2, p.y * TILE + 2, TILE - 4, TILE - 4); g.lineStyle(2, 0xe2a273, .65).strokeRect(p.x * TILE + 2, p.y * TILE + 2, TILE - 4, TILE - 4);
      }
    }
    if (preview.length) {
      g.lineStyle(3, 0xf6efcc, .92);
      let last: Point = actor;
      for (const p of preview) { g.lineBetween((last.x + .5) * TILE, (last.y + .5) * TILE, (p.x + .5) * TILE, (p.y + .5) * TILE); g.fillStyle(0xf6efcc).fillCircle((p.x + .5) * TILE, (p.y + .5) * TILE, 3); last = p; }
    }
    if (target) g.lineStyle(3, 0xe6af71, 1).strokeRect(target.x * TILE + 3, target.y * TILE + 3, TILE - 6, TILE - 6);
    for (const u of state.units) {
      if (!u.hp) {
        if(this.nodes.has(u.id) && !this.retiring.has(u.id)) {
          this.retiring.add(u.id);
          this.time.delayedCall(8000,()=>this.removeUnit(u.id));
        }
        if(!this.nodes.has(u.id))continue;
      }
      const previous = this.positions.get(u.id);
      let node = this.nodes.get(u.id);
      if (!node) {
        node = this.add.container((u.x + .5) * TILE, (u.y + 1) * TILE - 7).setDepth(10 + u.y);
        const teamColor=u.team==='player'?0x69c5ff:u.team==='ally'?0x6ee9c0:0xff776e;
        node.add(this.add.ellipse(0,-1,u.role==='기병'?56:46,16,0x06131d,.95).setStrokeStyle(3,teamColor,1));
        const sprite=this.add.sprite(0,0,u.sprite>=8?'boss-motion':'troops',u.sprite>=8?`walk-${u.sprite}-0`:`unit-${u.sprite}`);this.idle(u,sprite);
        sprite.name = 'sprite'; node.add(sprite);
        if(this.game.renderer.type===Phaser.WEBGL)sprite.preFX?.addGlow(0x06121b,4,0,false,.1,4);
        sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE,(_animation:Phaser.Animations.Animation,frame:Phaser.Animations.AnimationFrame)=>{
          this.motionFrames.push({id:u.id,kind:_animation.key.startsWith('attack-')?'attack':'walk',frame:frame.textureFrame});
          if(this.motionFrames.length>160)this.motionFrames.shift();
        });
        this.tweens.add({targets:sprite,y:-1.5,duration:650,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        const flag = this.add.graphics(); flag.name = 'flag'; node.add(flag);
        const health = this.add.graphics(); health.name = 'health'; node.add(health);
        const labelName=u.name.replace('동탁군 ','');
        const label = this.add.text(0,12,`${u.team==='player'?'◆':u.team==='ally'?'●':'▲'} ${labelName}`,{fontFamily:'"Noto Sans KR",sans-serif',fontSize:'12px',fontStyle:'bold',color:'#fff7e5',stroke:'#08131c',strokeThickness:2,backgroundColor:'#08131ceb',padding:{left:4,right:4,top:2,bottom:2}}).setOrigin(.5,0);
        label.name = 'label'; node.add(label); this.nodes.set(u.id, node);
      }
      const x = (u.x + .5) * TILE, y = (u.y + 1) * TILE - 7;
      node.setDepth(10 + u.y);
      if (previous && key(previous) !== key(u)) {
        const route=structuredClone(state), moving=findUnit(route,u.id)!;
        // A move and a lethal counter are committed together; still show the approach.
        moving.x=previous.x; moving.y=previous.y; moving.hp=moving.maxHp;
        const path=movementRange(route,moving).find(p=>key(p)===key(u))?.path ?? [{x:u.x,y:u.y}];
        this.walk(u,node,path,previous);
      } else if (!previous) node.setPosition(x, y);
      this.positions.set(u.id, { x: u.x, y: u.y });
      const sprite = node.getByName('sprite') as Phaser.GameObjects.Sprite;
      sprite.setAlpha(u.acted && state.phase === u.team ? .88 : 1);
      const flag = node.getByName('flag') as Phaser.GameObjects.Graphics;
      const color = u.team === 'player' ? 0x69c5ff : u.team === 'ally' ? 0x6ee9c0 : 0xff776e;
      flag.clear().lineStyle(2, 0xdfc28c).lineBetween(-24, -38, -24, -62);
      flag.fillStyle(color).fillTriangle(-23, -63, -9, -59, -23, -53);
      const health = node.getByName('health') as Phaser.GameObjects.Graphics;
      health.clear().fillStyle(0x05101a,1).fillRoundedRect(-24,2,48,8,2).lineStyle(1,0xe4e8db,1).strokeRoundedRect(-24,2,48,8,2);
      health.fillStyle(color).fillRoundedRect(-23,3,46*u.hp/u.maxHp,6,1);
      if (u.id === selectedId && u.hp) {
        const px = u.x * TILE, py = u.y * TILE;
        g.fillStyle(0xe0bd70, .1).fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        g.lineStyle(3, 0xe8c783, 1);
        for (const [cx, cy, sx, sy] of [[px + 3, py + 3, 1, 1], [px + TILE - 3, py + 3, -1, 1], [px + 3, py + TILE - 3, 1, -1], [px + TILE - 3, py + TILE - 3, -1, -1]]) {
          g.lineBetween(cx, cy, cx + sx * 14, cy); g.lineBetween(cx, cy, cx, cy + sy * 14);
        }
      }
    }
    if (state.fireTriggered && !this.fire) {
      this.fire = this.add.graphics().setDepth(4);
      for (const p of [{ x: 11.4, y: 2.4 }, { x: 12.1, y: 2.1 }, { x: 12.7, y: 2.8 }]) {
        this.fire.fillStyle(0xcc6b2d, .8).fillRect(p.x * TILE, p.y * TILE, 12, 18);
        this.fire.fillStyle(0xebc266, .9).fillRect(p.x * TILE + 3, p.y * TILE + 4, 6, 12);
      }
      this.tweens.add({ targets: this.fire, alpha: .55, duration: 380, yoyo: true, repeat: -1 });
    }
  }
  private idle(u: Unit, sprite: Phaser.GameObjects.Sprite) {
    if(!sprite.active) return;
    if(u.sprite>=8){const scale=this.motionData.walk.units[u.sprite].scale;sprite.stop().setTexture('boss-motion',`walk-${u.sprite}-0`).setScale(scale*.8,scale);return;}
    sprite.stop().setTexture('troops',`unit-${u.sprite}`).setOrigin(.5,.98).setDisplaySize(u.sprite===2?82:70,u.sprite===2?109:94);
  }
  private playMotion(kind: 'walk'|'attack',u:Unit,sprite:Phaser.GameObjects.Sprite) {
    const scale=this.motionData[kind].units[u.sprite].scale;
    sprite.play(`${kind}-${u.sprite}`,true).setScale(scale*.8,scale);
    sprite.anims.timeScale=this.current?.fast?1.6:1;
  }
  private walk(u:Unit,node:Phaser.GameObjects.Container,path:Point[],from:Point) {
    if(!path.length) return;
    this.tweens.killTweensOf(node);
    const sprite=node.getByName('sprite') as Phaser.GameObjects.Sprite;
    this.playMotion('walk',u,sprite); this.counts.walks++;
    const duration=this.current?.fast?72:135;
    const end=this.time.now+path.length*duration;
    this.activeWalks.add(u.id); this.visualUntil=Math.max(this.visualUntil,end);
    this.tweens.chain({targets:node,tweens:path.map((point,index)=>({
      x:(point.x+.5)*TILE,y:(point.y+1)*TILE-7,duration,ease:'Linear',
      onStart:()=>{const previous=path[index-1]??from;if(point.x!==previous.x)sprite.setFlipX(point.x<previous.x);node.setDepth(10+point.y);},
    })),onComplete:()=>{this.activeWalks.delete(u.id);this.idle(u,sprite);}});
  }
  private strike(attackerId:string,hit:Hit):Promise<void> {
    const u=this.current && findUnit(this.current.state,attackerId);
    const target=this.current && findUnit(this.current.state,hit.targetId);
    const node=this.nodes.get(attackerId);
    const duration=this.current?.fast?300:450;
    if(!u||!target||!node?.active){this.impact(hit);return Promise.resolve();}
    return new Promise(resolve=>{
      const sprite=node.getByName('sprite') as Phaser.GameObjects.Sprite;
      const x=node.x,y=node.y,dx=(target.x-u.x),dy=(target.y-u.y),length=Math.hypot(dx,dy)||1;
      let impacted=false;
      const impact=()=>{if(!impacted){impacted=true;this.impact(hit);}};
      const peak=(_animation:Phaser.Animations.Animation,frame:Phaser.Animations.AnimationFrame)=>{if(_animation.key.startsWith('attack-')&&frame.index>=3)impact();};
      const completeKey=`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}attack-${u.sprite}`;
      const complete=()=>{
        sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE,peak);
        sprite.off(completeKey,complete);sprite.off(Phaser.GameObjects.Events.DESTROY,complete);
        impact();
        if(node.active){node.setPosition(x,y);this.idle(u,sprite);}
        resolve();
      };
      sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE,peak);
      sprite.once(completeKey,complete);sprite.once(Phaser.GameObjects.Events.DESTROY,complete);
      sprite.setFlipX(target.x<u.x);this.playMotion('attack',u,sprite);this.counts.attacks++;
      this.tweens.add({targets:node,x:x+dx/length*12,y:y+dy/length*8,duration:duration*.28,yoyo:true,ease:'Sine.easeInOut'});
      if(u.role==='궁병') {
        const arrow=this.add.graphics().setDepth(90).setPosition(x,y-32);
        arrow.lineStyle(2,0xead4a3).lineBetween(-8,0,8,0);
        arrow.setRotation(Math.atan2(dy,dx));
        this.tweens.add({targets:arrow,x:(target.x+.5)*TILE,y:(target.y+.45)*TILE,delay:duration*.2,duration:duration*.35,onComplete:()=>arrow.destroy()});
      }
    });
  }
  hits(hits:Hit[],attackerId:string) {
    if(!this.current || !hits.length) return;
    this.pendingHitSequences++;
    void (async()=>{
      try {
        while(this.activeWalks.has(attackerId)) await this.pauseMotion(30);
        for(const hit of hits){
          await this.strike(hit.counter?hits[0].targetId:attackerId,hit);
          await this.pauseMotion(70);
        }
      }finally{this.pendingHitSequences--;}
    })();
  }
  private impact(hit:Hit) {
    const u=this.current && findUnit(this.current.state,hit.targetId); if(!u)return;
    this.visualUntil=Math.max(this.visualUntil,this.time.now+250);
    const node=this.nodes.get(u.id),sprite=node?.getByName('sprite') as Phaser.GameObjects.Sprite|undefined;
    this.counts.impacts++;
    if(sprite?.active){
      if(!hit.missed){sprite.setTintFill(0xffe5ba);this.time.delayedCall(75,()=>{if(sprite.active)sprite.clearTint();});}
      this.tweens.add({targets:sprite,x:hit.missed?8:3,duration:65,yoyo:true,repeat:hit.missed?0:1,onComplete:()=>{if(sprite.active)sprite.x=0;}});
    }
    if(!hit.missed) {
      const slash=this.add.graphics().setDepth(95).setPosition((u.x+.5)*TILE,(u.y+.45)*TILE);
      slash.lineStyle(3,0xffedbd,.9).lineBetween(-18,13,19,-12);
      slash.lineStyle(1,0xd79761,.8).lineBetween(-14,15,22,-9);
      this.tweens.add({targets:slash,alpha:0,scaleX:1.4,scaleY:1.4,duration:180,onComplete:()=>slash.destroy()});
    }
    const text=this.add.text((u.x+.5)*TILE,(u.y+.1)*TILE,hit.missed?'회피':`${hit.counter?'반격 ':''}−${hit.damage}`,{fontFamily:'serif',fontSize:'24px',fontStyle:'bold',color:hit.missed?'#dcd7bd':'#ffe0bd',stroke:'#33261b',strokeThickness:4}).setOrigin(.5).setDepth(100);
    this.tweens.add({targets:text,y:text.y-35,alpha:0,duration:650,onComplete:()=>text.destroy()});
    if(u.hp===0&&node?.active) this.tweens.add({targets:node,alpha:0,y:node.y+8,duration:230,onComplete:()=>this.removeUnit(u.id)});
  }
  private removeUnit(id:string) { this.activeWalks.delete(id);this.nodes.get(id)?.destroy(); this.nodes.delete(id); }
  private pauseMotion(duration:number):Promise<void> {return new Promise(resolve=>this.time.delayedCall(duration,()=>resolve()));}
  private motionBusy() {return this.activeWalks.size>0 || this.pendingHitSequences>0 || this.time.now<this.visualUntil;}
  async waitForAnimations():Promise<void> {
    while(this.ready&&this.motionBusy()) await this.pauseMotion(30);
  }
  motionSnapshot() {
    return { ...this.counts, frames:this.motionFrames.map(frame=>({...frame})), busy:this.motionBusy(), active:[...this.nodes].map(([id,node])=>{const sprite=node.getByName('sprite') as Phaser.GameObjects.Sprite;return {id,texture:sprite.texture.key,frame:sprite.frame.name,playing:sprite.anims.isPlaying};}) };
  }
}

export function createRenderer(parent: HTMLElement, scene: BattleScene): Phaser.Game {
  const game=new Phaser.Game({
    type: Phaser.AUTO, parent, backgroundColor: '#202e20', pixelArt: true, roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    scene, input: { activePointers: 3 }, audio: { noAudio: true },
    banner: false,
  });
  // CSS changes the parent when rotating or expanding a compact information panel.
  // Observe the actual map rectangle instead of relying on window resize timing.
  const resize=()=>{
    const width=parent.clientWidth,height=parent.clientHeight;
    if(!game.isBooted||!width||!height)return;
    if(game.scale.width!==width||game.scale.height!==height){
      game.scale.resize(width,height);
      game.canvas.style.width=`${width}px`;game.canvas.style.height=`${height}px`;
    }
  };
  const observer=new ResizeObserver(resize);observer.observe(parent);
  game.events.once(Phaser.Core.Events.READY,resize);
  game.events.once(Phaser.Core.Events.DESTROY,()=>observer.disconnect());
  return game;
}
