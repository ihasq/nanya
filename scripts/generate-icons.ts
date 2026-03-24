import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const SVG_PATH = path.join(PUBLIC_DIR, 'icon.svg')

const ICON_SIZES = [192, 512]

async function generateIcons() {
  console.log('Generating PWA icons...')

  const svgBuffer = fs.readFileSync(SVG_PATH)

  for (const size of ICON_SIZES) {
    const outputPath = path.join(PUBLIC_DIR, `icon-${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`  Generated: icon-${size}.png`)
  }

  // Generate apple-touch-icon (180x180)
  const appleTouchPath = path.join(PUBLIC_DIR, 'apple-touch-icon.png')
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath)
  console.log('  Generated: apple-touch-icon.png')

  console.log('Done!')
}

generateIcons().catch(console.error)
