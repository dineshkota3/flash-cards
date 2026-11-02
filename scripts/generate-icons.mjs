// One-time icon generation: renders icon.svg into all PWA PNG sizes.
// Run: npm run icons   (outputs are committed; sharp is a devDependency)
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'icon.svg'))

// Maskable + apple-touch-icon need full-bleed art (safe zone inside ~80%).
const maskableSvg = Buffer.from(
  readFileSync(join(root, 'icon.svg'), 'utf8').replace('rx="96"', 'rx="0"'),
)

const jobs = [
  { name: 'public/pwa-icon-192.png', input: svg, size: 192 },
  { name: 'public/pwa-icon-512.png', input: svg, size: 512 },
  { name: 'public/pwa-icon-maskable-192.png', input: maskableSvg, size: 192 },
  { name: 'public/pwa-icon-maskable-512.png', input: maskableSvg, size: 512 },
  { name: 'public/apple-touch-icon.png', input: maskableSvg, size: 180 },
]

for (const job of jobs) {
  await sharp(job.input).resize(job.size, job.size).png().toFile(join(root, job.name))
  console.log(`wrote ${job.name} (${job.size}x${job.size})`)
}
