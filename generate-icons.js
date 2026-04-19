#!/usr/bin/env node

/**
 * Generate Android launcher icons from favicon.svg
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const sourceFile = path.join(__dirname, 'favicon.svg');
const androidRes = path.join(__dirname, 'android/app/src/main/res');

async function generateIcons() {
  console.log('Generating Android launcher icons...\n');

  for (const [folder, size] of Object.entries(iconSizes)) {
    const outputDir = path.join(androidRes, folder);

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate regular icon
    const iconPath = path.join(outputDir, 'ic_launcher.png');
    await sharp(sourceFile)
      .resize(size, size)
      .png()
      .toFile(iconPath);
    console.log(`✓ Created ${folder}/ic_launcher.png (${size}x${size})`);

    // Generate round icon (same image, Android will clip it)
    const roundPath = path.join(outputDir, 'ic_launcher_round.png');
    await sharp(sourceFile)
      .resize(size, size)
      .png()
      .toFile(roundPath);
    console.log(`✓ Created ${folder}/ic_launcher_round.png (${size}x${size})`);

    // Generate foreground (for adaptive icons)
    const foregroundPath = path.join(outputDir, 'ic_launcher_foreground.png');
    // Foreground should be 108dp with 72dp safe area, so make it slightly larger
    const foregroundSize = Math.round(size * 1.5);
    await sharp(sourceFile)
      .resize(foregroundSize, foregroundSize)
      .png()
      .toFile(foregroundPath);
    console.log(`✓ Created ${folder}/ic_launcher_foreground.png (${foregroundSize}x${foregroundSize})`);
  }

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
