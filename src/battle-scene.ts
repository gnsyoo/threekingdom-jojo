import Phaser from 'phaser';
import { COLS, ROWS, key, terrainAt, type BattleState, type Point, type Reachable, type Hit } from './core.ts';

export const TILE = 64;
export type MapMode = 'inspect' | 'move' | 'attack';
export interface MapPresentation {
  state: BattleState; selectedId: string; mode: MapMode;
  reachable: Reachable[]; preview: Point[]; target: Point | null; grid: boolean;
}
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

  constructor() { super('battle'); }
  preload() {
    this.load.image('ground', `${import.meta.env.BASE_URL}assets/battlefield.png`);
    this.load.image('troops', `${import.meta.env.BASE_URL}assets/units.png`);
  }
  create() {
    const atlas = this.textures.get('troops');
    const source = atlas.getSourceImage() as HTMLImageElement;
    const w = source.width / 4, h = source.height / 2;
    for (let i = 0; i < 8; i++) atlas.add(`unit-${i}`, 0, (i % 4) * w, Math.floor(i / 4) * h, w, h);
    this.add.image(0, 0, 'ground').setOrigin(0).setDisplaySize(COLS * TILE, ROWS * TILE);
    const marker = this.add.graphics();
    marker.lineStyle(2, 0xb9dcaa, .55).strokeCircle(3.5 * TILE, 3.5 * TILE, 15);
    this.add.text(3.5 * TILE, 3.5 * TILE - 30, '민가', { fontFamily: 'serif', fontSize: '13px', color: '#edf4cc', stroke: '#233221', strokeThickness: 3 }).setOrigin(.5);
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
    const fit = Math.min(this.scale.width / (COLS * TILE), this.scale.height / (ROWS * TILE));
    camera.setZoom(this.overview ? fit : Math.max(fit, this.scale.width < 850 ? .73 : .75));
    this.updateBounds();
    const cao = this.current?.state.units.find(u => u.id === 'cao');
    if (initial && this.scale.height < 440 && cao) this.centerOn(cao);
    else if (initial || this.overview) camera.centerOn(COLS * TILE / 2, ROWS * TILE / 2);
  }
  zoom(delta: number) {
    if (!this.ready) return;
    const camera = this.cameras.main;
    const center = camera.midPoint.clone();
    this.overview = false; camera.setZoom(Phaser.Math.Clamp(camera.zoom + delta, .28, 1.65)); this.updateBounds(); camera.centerOn(center.x, center.y);
  }
  private updateBounds() {
    const c = this.cameras.main, w = COLS * TILE, h = ROWS * TILE;
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
      for (let x = 0; x <= COLS; x++) g.lineBetween(x * TILE, 0, x * TILE, ROWS * TILE);
      for (let y = 0; y <= ROWS; y++) g.lineBetween(0, y * TILE, COLS * TILE, y * TILE);
    }
    if (mode === 'move') {
      for (const p of reachable) { g.fillStyle(0x438fc4, .25).fillRect(p.x * TILE + 1, p.y * TILE + 1, TILE - 2, TILE - 2); g.lineStyle(1, 0x8fceef, .65).strokeRect(p.x * TILE + 1, p.y * TILE + 1, TILE - 2, TILE - 2); }
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
      if (!u.hp) { this.nodes.get(u.id)?.destroy(); this.nodes.delete(u.id); continue; }
      const previous = this.positions.get(u.id);
      let node = this.nodes.get(u.id);
      if (!node) {
        node = this.add.container((u.x + .5) * TILE, (u.y + 1) * TILE - 7).setDepth(10 + u.y);
        node.add(this.add.ellipse(0, -2, u.sprite === 2 ? 54 : 38, 11, 0x12211a, .48));
        const sprite = this.add.image(0, 0, 'troops', `unit-${u.sprite}`).setOrigin(.5, .98).setDisplaySize(u.sprite === 2 ? 82 : 70, u.sprite === 2 ? 109 : 94);
        sprite.name = 'sprite'; node.add(sprite);
        const flag = this.add.graphics(); flag.name = 'flag'; node.add(flag);
        const health = this.add.graphics(); health.name = 'health'; node.add(health);
        const label = this.add.text(0, 13, u.name, { fontFamily: '"Noto Serif KR", serif', fontSize: '12px', color: u.team === 'enemy' ? '#f7d8ba' : '#f1e9c8', stroke: '#17251d', strokeThickness: 3 }).setOrigin(.5, 0);
        label.name = 'label'; node.add(label); this.nodes.set(u.id, node);
      }
      const x = (u.x + .5) * TILE, y = (u.y + 1) * TILE - 7;
      node.setDepth(10 + u.y);
      if (previous && key(previous) !== key(u)) {
        this.tweens.killTweensOf(node); this.tweens.add({ targets: node, x, y, duration: 280, ease: 'Sine.easeInOut' });
        (node.getByName('sprite') as Phaser.GameObjects.Image).setFlipX(u.x < previous.x);
      } else if (!previous) node.setPosition(x, y);
      this.positions.set(u.id, { x: u.x, y: u.y });
      const sprite = node.getByName('sprite') as Phaser.GameObjects.Image;
      sprite.setAlpha(u.acted && state.phase === u.team ? .66 : 1);
      const flag = node.getByName('flag') as Phaser.GameObjects.Graphics;
      const color = u.team === 'player' ? 0x6db8e8 : u.team === 'ally' ? 0x74c1aa : 0xd38551;
      flag.clear().lineStyle(2, 0xdfc28c).lineBetween(-24, -38, -24, -62);
      flag.fillStyle(color).fillTriangle(-23, -63, -9, -59, -23, -53);
      const health = node.getByName('health') as Phaser.GameObjects.Graphics;
      health.clear().fillStyle(0x162720, .9).fillRoundedRect(-22, 3, 44, 6, 2);
      health.fillStyle(u.team === 'enemy' ? 0xc77854 : 0x88c398).fillRoundedRect(-21, 4, 42 * u.hp / u.maxHp, 4, 1);
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
  hits(hits: Hit[]) {
    if (!this.current) return;
    hits.forEach((hit, i) => {
      const u = this.current!.state.units.find(u => u.id === hit.targetId); if (!u) return;
      this.time.delayedCall(i * 250, () => {
        const text = this.add.text((u.x + .5) * TILE, (u.y + .1) * TILE, hit.missed ? '회피' : `${hit.counter ? '반격 ' : ''}−${hit.damage}`, { fontFamily: 'serif', fontSize: '24px', fontStyle: 'bold', color: hit.missed ? '#dcd7bd' : '#ffe0bd', stroke: '#33261b', strokeThickness: 4 }).setOrigin(.5).setDepth(100);
        this.tweens.add({ targets: text, y: text.y - 35, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
      });
    });
  }
}

export function createRenderer(parent: HTMLElement, scene: BattleScene): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO, parent, backgroundColor: '#202e20', pixelArt: true, roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    scene, input: { activePointers: 3 }, audio: { noAudio: true },
    banner: false,
  });
}
