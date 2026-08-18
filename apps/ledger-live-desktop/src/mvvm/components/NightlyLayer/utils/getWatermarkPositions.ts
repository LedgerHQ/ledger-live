import type { NightlyLayerWatermark } from "../types";

const WATERMARK_CELL_WIDTH = 200;
const WATERMARK_CELL_HEIGHT = 100;
const WATERMARK_GRID_COUNT = 20;

export function getWatermarkPositions(): ReadonlyArray<NightlyLayerWatermark> {
  const positions: NightlyLayerWatermark[] = [];

  for (let y = 0.5; y < WATERMARK_GRID_COUNT; y++) {
    for (let x = 0.5; x < WATERMARK_GRID_COUNT; x++) {
      positions.push({
        top: y * WATERMARK_CELL_HEIGHT,
        left: x * WATERMARK_CELL_WIDTH,
      });
    }
  }

  return positions;
}
