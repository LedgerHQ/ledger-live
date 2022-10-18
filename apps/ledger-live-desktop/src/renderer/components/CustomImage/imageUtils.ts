import { ImageDimensions } from "./types";

export function createCanvas(
  image?: HTMLImageElement,
): {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
} {
  const canvas = document.createElement("canvas");
  if (image) {
    canvas.width = image.width;
    canvas.height = image.height;
  }
  const context = canvas.getContext("2d");
  return { canvas, context };
}

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotationDeg: number) {
  const rotRad = getRadianAngle(rotationDeg);

  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export function scaleDimensions(dimensions: ImageDimensions, scale: number) {
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
  };
}
