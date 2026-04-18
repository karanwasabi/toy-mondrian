import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

/**
 * Builds `public/og.png`: asymmetrical Mondrian-style art from `scripts/og-art-base.png`
 * (replace that PNG when you want a new composition) + Bebas Neue title strip.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const fontPath = path.join(root, 'node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff');
const artPath = path.join(__dirname, 'og-art-base.png');

const fontData = fs.readFileSync(fontPath);

const W = 1200;
const H = 630;
const ART_H = 480;
const TITLE_H = H - ART_H;

if (!fs.existsSync(artPath)) {
  console.error('Missing', artPath, '— add scripts/og-art-base.png (Mondrian-style, no text), then re-run.');
  process.exit(1);
}

const artPng = await sharp(artPath).resize(W, ART_H, { fit: 'cover', position: 'centre' }).png().toBuffer();
const artDataUrl = `data:image/png;base64,${artPng.toString('base64')}`;

const markup = {
  type: 'div',
  props: {
    style: {
      width: W,
      height: H,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#111111',
    },
    children: [
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            width: W,
            height: ART_H,
            position: 'relative',
            backgroundColor: '#111111',
          },
          children: [
            {
              type: 'img',
              props: {
                src: artDataUrl,
                width: W,
                height: ART_H,
                style: {
                  objectFit: 'cover',
                },
              },
            },
          ],
        },
      },
      {
        type: 'div',
        props: {
          style: {
            width: W,
            height: TITLE_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111111',
          },
          children: {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                color: '#ffffff',
                fontSize: 112,
                fontFamily: 'Bebas Neue',
                letterSpacing: 4,
              },
              children: 'Toy Mondrian',
            },
          },
        },
      },
    ],
  },
};

const svg = await satori(markup, {
  width: W,
  height: H,
  fonts: [
    {
      name: 'Bebas Neue',
      data: fontData,
      style: 'normal',
      weight: 400,
    },
  ],
});

const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: W,
  },
});
const pngBuffer = resvg.render().asPng();

const outPath = path.join(root, 'public/og.png');
fs.writeFileSync(outPath, pngBuffer);
console.log('Wrote', outPath);
