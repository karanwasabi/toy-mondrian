import polygonClipping from 'polygon-clipping';
import { CellColorId } from '../engine/types';
import { getColorHex } from '../engine/palette';

type GenerateSvgRequest = {
  type: 'GENERATE_SVG';
  payload: {
    grid: Uint8Array;
    width: number;
    height: number;
    cellSize: number;
  };
};

type GenerateSvgResponse = {
  type: 'SVG_GENERATED';
  payload: {
    svg: string;
  };
};

type Ring = [number, number][];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

const COLOR_ORDER: CellColorId[] = [CellColorId.Red, CellColorId.Blue, CellColorId.Yellow, CellColorId.White];

self.addEventListener('message', (event: MessageEvent<GenerateSvgRequest>) => {
  if (event.data?.type !== 'GENERATE_SVG') {
    return;
  }

  const { grid, width, height, cellSize } = event.data.payload;
  const svg = buildSvgFromGrid(grid, width, height, cellSize);

  const response: GenerateSvgResponse = {
    type: 'SVG_GENERATED',
    payload: { svg },
  };
  self.postMessage(response);
});

/** Matches CPU board raster: 12px cells, 2px borders (see `compose-board-rgba.ts`). */
const RASTER_CELL_UNITS = 12;
const RASTER_BORDER_UNITS = 2;

function buildSvgFromGrid(grid: Uint8Array, width: number, height: number, cellSize: number): string {
  const polygonsByColor = new Map<CellColorId, Polygon[]>();
  for (const colorId of COLOR_ORDER) {
    polygonsByColor.set(colorId, []);
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const colorId = grid[y * width + x] as CellColorId;
      if (colorId === CellColorId.Empty) {
        continue;
      }

      const polygon = cellSquarePolygon(x, y);
      const group = polygonsByColor.get(colorId);
      if (group) {
        group.push(polygon);
      }
    }
  }

  const viewWidth = width * cellSize;
  const viewHeight = height * cellSize;
  const strokeWidth = (cellSize * RASTER_BORDER_UNITS) / RASTER_CELL_UNITS;
  const viewPad = strokeWidth / 2;
  const viewBoxW = viewWidth + strokeWidth;
  const viewBoxH = viewHeight + strokeWidth;

  const paths: string[] = [];
  for (const colorId of COLOR_ORDER) {
    const polygons = polygonsByColor.get(colorId) ?? [];
    if (polygons.length === 0) {
      continue;
    }

    const merged = unionPolygons(polygons);
    if (merged.length === 0) {
      continue;
    }

    const d = toSvgPathData(merged, cellSize);
    const fill = getColorHex(colorId);
    paths.push(
      `<path d="${d}" fill="${fill}" stroke="#111111" stroke-width="${strokeWidth}" stroke-linejoin="miter" stroke-linecap="butt" shape-rendering="crispEdges" />`
    );
  }

  return [
    `<svg viewBox="${-viewPad} ${-viewPad} ${viewBoxW} ${viewBoxH}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect x="0" y="0" width="${viewWidth}" height="${viewHeight}" fill="#ffffff" shape-rendering="crispEdges" />`,
    ...paths,
    '</svg>',
  ].join('');
}

function cellSquarePolygon(x: number, y: number): Polygon {
  return [
    [
      [x, y],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
      [x, y],
    ],
  ];
}

function unionPolygons(polygons: Polygon[]): MultiPolygon {
  const [first, ...rest] = polygons;
  if (!first) {
    return [];
  }
  if (rest.length === 0) {
    return [first];
  }
  const result = polygonClipping.union(first, ...rest);
  return (result as MultiPolygon) ?? [];
}

function toSvgPathData(multiPolygon: MultiPolygon, cellSize: number): string {
  const segments: string[] = [];

  for (const polygon of multiPolygon) {
    for (const ring of polygon) {
      if (ring.length === 0) {
        continue;
      }

      const [first, ...rest] = ring;
      segments.push(`M ${first[0] * cellSize} ${first[1] * cellSize}`);
      for (const point of rest) {
        segments.push(`L ${point[0] * cellSize} ${point[1] * cellSize}`);
      }
      segments.push('Z');
    }
  }

  return segments.join(' ');
}
