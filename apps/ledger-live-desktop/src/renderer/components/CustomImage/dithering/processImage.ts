import { createCanvas } from "../imageUtils";
import { DitheringAlgorithm, ProcessImageArgs, ProcessorResult } from "./types";

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function contrastRGB(rgbVal: number, contrastVal: number) {
  return (rgbVal - 128) * contrastVal + 128;
}

// Helper function to safely apply error to a pixel
function applyErrorToPixel(
  x: number,
  y: number,
  width: number,
  height: number,
  quantError: number,
  errorFraction: number,
  pixels256Colors: number[][],
) {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    pixels256Colors[y][x] = Math.floor(pixels256Colors[y][x] + quantError * errorFraction);
  }
}

function applyFloydSteinbergDithering(
  x: number,
  y: number,
  width: number,
  height: number,
  quantError: number,
  pixels256Colors: number[][],
) {
  /*
   * Floyd-Steinberg dithering
   * https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering
   *         x - 1  |   x    |  x + 1
   *   y            |   *    | 7 / 16
   * y + 1  3 / 16  | 5 / 16 | 1 / 16
   */
  applyErrorToPixel(x + 1, y, width, height, quantError, 7 / 16, pixels256Colors);
  applyErrorToPixel(x - 1, y + 1, width, height, quantError, 3 / 16, pixels256Colors);
  applyErrorToPixel(x, y + 1, width, height, quantError, 5 / 16, pixels256Colors);
  applyErrorToPixel(x + 1, y + 1, width, height, quantError, 1 / 16, pixels256Colors);
}

function applyAtkinsonDithering(
  x: number,
  y: number,
  width: number,
  height: number,
  quantError: number,
  pixels256Colors: number[][],
) {
  /*
   * Atkinson dithering
   * https://en.wikipedia.org/wiki/Atkinson_dithering
   *         x - 1  |   x    |  x + 1 |  x + 2
   *   y            |   *    |  1 / 8 |  1 / 8
   * y + 1   1 / 8  | 1 / 8  |  1 / 8
   * y + 2          | 1 / 8  |
   */
  const errorFraction = 1 / 8;
  applyErrorToPixel(x + 1, y, width, height, quantError, errorFraction, pixels256Colors);
  applyErrorToPixel(x + 2, y, width, height, quantError, errorFraction, pixels256Colors);
  applyErrorToPixel(x - 1, y + 1, width, height, quantError, errorFraction, pixels256Colors);
  applyErrorToPixel(x, y + 1, width, height, quantError, errorFraction, pixels256Colors);
  applyErrorToPixel(x + 1, y + 1, width, height, quantError, errorFraction, pixels256Colors);
  applyErrorToPixel(x, y + 2, width, height, quantError, errorFraction, pixels256Colors);
}

// Reduced Atkinson dithering implementation
function applyReducedAtkinsonDithering(
  x: number,
  y: number,
  width: number,
  height: number,
  quantError: number,
  pixels256Colors: number[][],
) {
  /*
   *    x    |  x + 1
   *    *    | 2 / 16 | 1 / 16
   *  2 / 16 | 1 / 16 |
   */
  applyErrorToPixel(x + 1, y, width, height, quantError, 2 / 16, pixels256Colors);
  applyErrorToPixel(x + 2, y, width, height, quantError, 1 / 16, pixels256Colors);
  applyErrorToPixel(x, y + 1, width, height, quantError, 2 / 16, pixels256Colors);
  applyErrorToPixel(x + 1, y + 1, width, height, quantError, 1 / 16, pixels256Colors);
}

function calculatePixelLightness(pixel: number[]): number {
  // Use HSL lightness calculation for more accurate perceptual lightness
  // This provides better contrast preservation compared to simple RGB averaging
  const max = Math.max(pixel[0], pixel[1], pixel[2]);
  const min = Math.min(pixel[0], pixel[1], pixel[2]);
  return Math.floor((max + min) / 2.0);
}

// simutaneously apply grayscale and contrast to the image
function applyFilter(
  imageData: ImageData,
  contrastAmount: number,
  ditheringAlgorithm: DitheringAlgorithm,
  bitsPerPixel: 1 | 4,
): { imageDataResult: Uint8ClampedArray; hexRawResult: string } {
  let hexRawResult = "";
  const filteredImageData = [];

  const data = imageData.data;

  // Determine number of gray levels based on bitsPerPixel
  const numLevelsOfGray = Math.pow(2, bitsPerPixel);
  const rgbStep = 255 / (numLevelsOfGray - 1);

  const { width, height } = imageData;

  const pixelsLightness: number[][] = Array.from(Array(height), () => Array(width));
  const pixels256Colors: number[][] = Array.from(Array(height), () => Array(width));
  const pixelsNColors: number[][] = Array.from(Array(height), () => Array(width));

  for (let pxIndex = 0; pxIndex < data.length / 4; pxIndex += 1) {
    const x = pxIndex % width;
    const y = (pxIndex - x) / width;

    const [redIndex, greenIndex, blueIndex] = [4 * pxIndex, 4 * pxIndex + 1, 4 * pxIndex + 2];
    const pixelLightness = calculatePixelLightness([
      data[redIndex],
      data[greenIndex],
      data[blueIndex],
    ]);
    pixelsLightness[y][x] = pixelLightness;

    /** lightness value after applying the contrast */
    pixels256Colors[y][x] = clamp(contrastRGB(pixelLightness, contrastAmount), 0, 255);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldpixel = pixels256Colors[y][x];

      let posterizedGray256: number;
      if (bitsPerPixel === 1) {
        posterizedGray256 = oldpixel >= 127 ? 255 : 0;
      } else {
        const posterizedGrayNColors = Math.floor(oldpixel / rgbStep);
        posterizedGray256 = posterizedGrayNColors * rgbStep;
      }

      const newpixel = posterizedGray256;
      pixels256Colors[y][x] = newpixel;
      const quantError = oldpixel - newpixel;

      // Apply dithering based on algorithm
      switch (ditheringAlgorithm) {
        case "floyd-steinberg":
          applyFloydSteinbergDithering(x, y, width, height, quantError, pixels256Colors);
          break;
        case "atkinson":
          applyAtkinsonDithering(x, y, width, height, quantError, pixels256Colors);
          break;
        case "reduced-atkinson":
          applyReducedAtkinsonDithering(x, y, width, height, quantError, pixels256Colors);
          break;
      }

      const valNColors = clamp(Math.floor(pixels256Colors[y][x] / rgbStep), 0, numLevelsOfGray - 1);
      pixelsNColors[y][x] = valNColors;
      /** gray rgb value after applying the contrast, in [0,255] */
      const val256Colors = valNColors * rgbStep;
      filteredImageData.push(val256Colors); // R
      filteredImageData.push(val256Colors); // G
      filteredImageData.push(val256Colors); // B
      filteredImageData.push(255); // alpha
    }
  }

  const orderedPixelsNColors = [];
  // Raw data -> by column, from right to left, from top to bottom
  for (let x = width; x--; ) {
    for (let y = 0; y < height; y++) {
      orderedPixelsNColors.push(pixelsNColors[y][x]);
    }
  }

  if (bitsPerPixel === 4) {
    hexRawResult = orderedPixelsNColors.map(pixel => pixel.toString(16)).join("");
  } else if (bitsPerPixel === 1) {
    const hexValues = [];
    let buffer = 0,
      bitsCount = 0;
    for (const pixel of orderedPixelsNColors) {
      //       1 BPP ─ pack 4 pixels (bits) per 1-hex-digit
      buffer = (buffer << 1) | (1 - (pixel & 1)); // invert colour bit
      if (++bitsCount === 4) {
        // flush every 4 pixels (= 4 bits = 1 hex digit)
        hexValues.push(buffer.toString(16));
        buffer = bitsCount = 0;
      }
    }
    if (bitsCount) {
      // tail padding
      hexValues.push((buffer << (4 - bitsCount)).toString(16));
    }
    hexRawResult = hexValues.join("");
  }

  return {
    imageDataResult: Uint8ClampedArray.from(filteredImageData),
    hexRawResult,
  };
}

export function processImage(args: ProcessImageArgs): ProcessorResult {
  const { image, contrast, bitsPerPixel, ditheringAlgorithm } = args;
  const { context, canvas } = createCanvas(image);
  if (!context) throw Error("Context is null");
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { naturalHeight: height, naturalWidth: width } = image;
  const { imageDataResult: grayData, hexRawResult } = applyFilter(
    imageData,
    contrast,
    ditheringAlgorithm,
    bitsPerPixel,
  );
  context.putImageData(
    new ImageData(grayData, width, height), // eslint-disable-line no-undef
    0,
    0,
  );
  const grayScaleBase64 = canvas.toDataURL();
  return {
    previewResult: { imageBase64DataUri: grayScaleBase64, height, width },
    rawResult: { hexData: hexRawResult, height, width },
  };
}
