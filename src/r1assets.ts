import { mkdirSync, writeFileSync } from 'node:fs'
import { build, MODEL_H, MOTION_TIMING, POSE0, poseAt, type Motion, type Pose } from '../hooks/clawd3d'
import { modelSvg } from '../hooks/hero3d'
import { LOOKS, LOOK_NAMES } from '../hooks/looks'
import { backdropSvg, PIXELIZE } from '../hooks/svg'
import { BACKDROPS } from '../hooks/scene'
import { MONOCRAFT, MONOCRAFT_BOLD } from '../hooks/monocraft'

const out = process.argv[2]!
mkdirSync(out, { recursive: true })
const SW = 320, SCALE = 2, BGS = 2.5, HEROH = 40
const s = HEROH / MODEL_H

// ---- backdrops
const floors: Record<string, number> = {}
for (const look of LOOK_NAMES) for (const b of BACKDROPS) {
  const r = backdropSvg(b, look, SW, BGS)
  floors[b] = r.floor
  writeFileSync(`${out}/bg-${look}-${b}.svg`, r.svg)
}

// ---- Clawd motions: the plugin's own plus a few for the pet
type Mo = { frames: number; dur: number; pose: (t: number) => Partial<Pose> }
const YAW = 0.55
const plugin = (m: Motion): Mo => ({ frames: MOTION_TIMING[m].frames, dur: MOTION_TIMING[m].dur, pose: t => poseAt(m, t, YAW) })
const sinv = (t: number) => Math.sin(Math.PI * 2 * t)
const MOTIONS: Record<string, Mo> = {
  idle: plugin('idle'), walk: plugin('walk'), sleep: plugin('sleep'),
  celebrate: plugin('celebrate'), dance: plugin('dance'),
  wave: plugin('wave'), shrug: plugin('shrug'), spin: plugin('spin'),
  // the pet's own moods, built from the same model
  // skipping rope: a hop per turn, arms out at the sides to hold the rope
  rope: { frames: 8, dur: 0.7, pose: t => { const up = Math.sin(Math.PI * t); return { yaw: YAW * 0.3, hop: up * 2.6, crouch: 0.22 * (1 - up), armL: 0.75, armR: 0.75, walk: Math.PI * 2 * t, stride: 0.3 * up, sq: 1 + 0.06 * up, eyes: 'happy' as const } } },
  // whistling a tune: eyes shut, a gentle sway
  whistle: { frames: 8, dur: 1.6, pose: t => ({ yaw: YAW * 0.5 + 0.1 * sinv(t), pitch: -0.08, roll: 0.05 * sinv(t), sq: 1 + 0.03 * sinv(2 * t), armL: 0.1, armR: 0.1, eyes: Math.sin(Math.PI * 2 * t * 2) > 0.7 ? 'happy' as const : 'closed' as const }) },
  happy: { frames: 8, dur: 1.2, pose: t => ({ yaw: YAW * 0.6, hop: Math.abs(sinv(t / 2)) * 0.5, roll: 0.03 * sinv(t), armL: 0.2 + 0.2 * sinv(t), armR: 0.2 - 0.2 * sinv(t), eyes: 'happy' }) },
  dizzy: { frames: 8, dur: 0.9, pose: t => ({ yaw: YAW * 0.4, dx: 0.5 * sinv(t), roll: 0.12 * sinv(t), armL: 0.5, armR: 0.5, hop: 0.2 * Math.abs(sinv(2 * t)), eyes: 'dizzy' }) },
  pet: { frames: 6, dur: 1, pose: t => ({ yaw: YAW * 0.4, crouch: 0.12, roll: 0.05 * sinv(t), sq: 1 + 0.03 * sinv(t), eyes: 'happy', armL: 0.2, armR: 0.2 }) },
}
const CW = 70, CH = 66 // cell, stage units (even, so the pixel grid lines up)
const names = Object.keys(MOTIONS)
const COLS = Math.max(...names.map(n => MOTIONS[n]!.frames))
const manifest = { cw: CW, ch: CH, scale: SCALE, bgscale: BGS, sw: SW, h: 128, floors, motions: {} as Record<string, { row: number; frames: number; dur: number }> }
names.forEach((n, row) => { manifest.motions[n] = { row, frames: MOTIONS[n]!.frames, dur: MOTIONS[n]!.dur } })

for (const look of LOOK_NAMES) {
  const L = LOOKS[look]!
  const hero = L.art?.hero()
  const pixelArt = L.pixel === true
  let cells = ''
  names.forEach((n, row) => {
    const m = MOTIONS[n]!
    for (let k = 0; k < m.frames; k++) {
      const model = build({ ...POSE0, ...m.pose(k / m.frames) }, s)
      const g = (hero ?? modelSvg)(model, CW / 2, CH - 6)
      cells += `<g transform="translate(${k * CW} ${row * CH})">${pixelArt ? `<g filter="url(#sc-pixelize-claude)">${g}</g>` : g}</g>`
    }
  })
  const defs = (pixelArt ? `<defs>${PIXELIZE(SW, { x: 0, y: 0, w: CW, h: CH })}</defs>` : '') + (L.art?.defs ? `<defs>${L.art.defs(SW, 128)}</defs>` : '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CW * SCALE}" height="${names.length * CH * SCALE}" viewBox="0 0 ${COLS * CW} ${names.length * CH}">${defs}${cells}</svg>`
  writeFileSync(`${out}/sheet-${look}.svg`, svg)
}


// ---- anchors for hats, glasses and the like: where the head, the eyes and the body are in every frame (cell asset px)
const avg = (pts: readonly (readonly [number, number])[]) => [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length] as const
const r1 = (v: number) => Math.round(v * 10) / 10
const anchors: Record<string, number[][]> = {}
for (const n of names) {
  const m = MOTIONS[n]!
  anchors[n] = []
  for (let k = 0; k < m.frames; k++) {
    const model = build({ ...POSE0, ...m.pose(k / m.frames) }, s)
    const body = model.parts.find(p => p.name === 'body')!
    const xs = body.hull.map(q => q[0]), ys = body.hull.map(q => q[1])
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const top = body.faces.find(f => f.name === 'top')
    const [hx, hy] = top ? avg(top.pts) : [(minX + maxX) / 2, minY]
    let ex = (minX + maxX) / 2, ey = minY + (maxY - minY) * 0.3, ed = (maxX - minX) * 0.45, ang = 0, vis = 0
    if (model.eyes.length >= 2) {
      const c = model.eyes.map(e => avg((e.poly ?? e.line)!))
      const [l, r] = c[0]![0] < c[1]![0] ? [c[0]!, c[1]!] : [c[1]!, c[0]!]
      ex = (l[0] + r[0]) / 2; ey = (l[1] + r[1]) / 2; ed = Math.hypot(r[0] - l[0], r[1] - l[1]); ang = Math.atan2(r[1] - l[1], r[0] - l[0]); vis = 1
    }
    const cell = (x: number, y: number) => [r1((CW / 2 + x) * SCALE), r1((CH - 6 + y) * SCALE)]
    const [chx, chy] = cell(hx, hy), [cex, cey] = cell(ex, ey)
    anchors[n]!.push([chx!, chy!, r1((maxX - minX) * SCALE), r1((maxY - minY) * SCALE), cex!, cey!, r1(ed * SCALE), Math.round(ang * 1000) / 1000, vis])
  }
}

// ---- look metadata + font
const looks = LOOK_NAMES.map(name => {
  const L = LOOKS[name]!
  return { name, label: L.label, card: L.paper?.card ?? '#f6f1e7', ink: L.paper?.ink ?? '#2b2420', accent: L.titleColor ?? '#d97757', edge: L.edge ?? L.art?.sky ?? '#1b1b2b' }
})
writeFileSync(`${out}/looks.json`, JSON.stringify(looks))
writeFileSync(`${out}/manifest.json`, JSON.stringify({ ...manifest, anchors }))
writeFileSync(`${out}/mono.b64.json`, JSON.stringify({ regular: MONOCRAFT, bold: MONOCRAFT_BOLD }))
console.log('ok', LOOK_NAMES.length, 'looks', names.length, 'motions', COLS, 'cols')
