import { mkdirSync, writeFileSync } from 'node:fs'
import { build, MODEL_H, MOTION_TIMING, POSE0, poseAt, type Motion, type Pose } from '../hooks/clawd3d'
import { modelSvg } from '../hooks/hero3d'
import { LOOKS, LOOK_NAMES } from '../hooks/looks'
import { backdropSvg, PIXELIZE } from '../hooks/svg'
import { BACKDROPS } from '../hooks/scene'
import { MONOCRAFT, MONOCRAFT_BOLD } from '../hooks/monocraft'

const out = process.argv[2]!
mkdirSync(out, { recursive: true })
const SW = 320, SCALE = 2, HEROH = 40
const s = HEROH / MODEL_H

// ---- backdrops
const floors: Record<string, number> = {}
for (const look of LOOK_NAMES) for (const b of BACKDROPS) {
  const r = backdropSvg(b, look, SW, SCALE)
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
  sad: { frames: 8, dur: 3, pose: t => ({ yaw: YAW * 0.3, crouch: 0.25 + 0.05 * sinv(t), pitch: 0.2, armL: -0.1, armR: -0.1, sq: 1 + 0.015 * sinv(t), eyes: 'sad' }) },
  happy: { frames: 8, dur: 1.2, pose: t => ({ yaw: YAW * 0.6, hop: Math.abs(sinv(t / 2)) * 0.5, roll: 0.03 * sinv(t), armL: 0.2 + 0.2 * sinv(t), armR: 0.2 - 0.2 * sinv(t), eyes: 'happy' }) },
  eat: { frames: 8, dur: 0.8, pose: t => ({ yaw: YAW * 0.5, crouch: 0.15 * Math.abs(sinv(t)), pitch: 0.12 * sinv(t), armL: 0.9, armR: 0.9, liftL: 1.2, liftR: 1.2, eyes: Math.sin(Math.PI * 2 * t) > 0.6 ? 'closed' : 'happy' }) },
  dizzy: { frames: 8, dur: 0.9, pose: t => ({ yaw: YAW * 0.4, dx: 0.5 * sinv(t), roll: 0.12 * sinv(t), armL: 0.5, armR: 0.5, hop: 0.2 * Math.abs(sinv(2 * t)), eyes: 'dizzy' }) },
  pet: { frames: 6, dur: 1, pose: t => ({ yaw: YAW * 0.4, crouch: 0.12, roll: 0.05 * sinv(t), sq: 1 + 0.03 * sinv(t), eyes: 'happy', armL: 0.2, armR: 0.2 }) },
}
const CW = 70, CH = 66 // cell, stage units (even, so the pixel grid lines up)
const names = Object.keys(MOTIONS)
const COLS = Math.max(...names.map(n => MOTIONS[n]!.frames))
const manifest = { cw: CW, ch: CH, scale: SCALE, sw: SW, h: 128, floors, motions: {} as Record<string, { row: number; frames: number; dur: number }> }
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
  const defs = pixelArt ? `<defs>${PIXELIZE(SW, { x: 0, y: 0, w: CW, h: CH })}</defs>` : (L.art?.defs ? '' : '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CW * SCALE}" height="${names.length * CH * SCALE}" viewBox="0 0 ${COLS * CW} ${names.length * CH}">${defs}${cells}</svg>`
  writeFileSync(`${out}/sheet-${look}.svg`, svg)
}

// ---- look metadata + font
const looks = LOOK_NAMES.map(name => {
  const L = LOOKS[name]!
  return { name, label: L.label, card: L.paper?.card ?? '#f6f1e7', ink: L.paper?.ink ?? '#2b2420', accent: L.titleColor ?? '#d97757', edge: L.edge ?? L.art?.sky ?? '#1b1b2b' }
})
writeFileSync(`${out}/looks.json`, JSON.stringify(looks))
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest))
writeFileSync(`${out}/mono.b64.json`, JSON.stringify({ regular: MONOCRAFT, bold: MONOCRAFT_BOLD }))
console.log('ok', LOOK_NAMES.length, 'looks', names.length, 'motions', COLS, 'cols')
