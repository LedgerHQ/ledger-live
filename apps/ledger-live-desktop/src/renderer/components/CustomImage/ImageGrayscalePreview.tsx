import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flex, Theme } from "@ledgerhq/react-ui";
import { ImageProcessingError } from "@ledgerhq/live-common/customImage/errors";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { createCanvas } from "./imageUtils";
import { ImageBase64Data, ImageDimensions } from "./types";
import ContrastChoice from "./ContrastChoice";
import FramedPicture from "./FramedPicture";
import { useTheme } from "styled-components";
import { getFramedPictureConfig } from "./framedPictureConfigs";
import { getScreenSpecs } from "@ledgerhq/live-common/device/use-cases/screenSpecs";

export type ProcessorPreviewResult = ImageBase64Data & ImageDimensions;
export type ProcessorRawResult = { hexData: string } & ImageDimensions;

export type ProcessorResult = {
  /**
   * Image data that can be displayed in LL
   */
  previewResult: ProcessorPreviewResult;
  /**
   * Image data that can be transfered to the device
   */
  rawResult: ProcessorRawResult;
};

const getContrasts = (theme: Theme) => [
  {
    val: 1,
    color: { topLeft: theme.colors.neutral.c40, bottomRight: theme.colors.neutral.c30 },
  },
  {
    val: 1.5,
    color: { topLeft: theme.colors.neutral.c50, bottomRight: theme.colors.neutral.c30 },
  },
  {
    val: 2,
    color: { topLeft: theme.colors.neutral.c60, bottomRight: theme.colors.neutral.c30 },
  },
  {
    val: 3,
    color: { topLeft: theme.colors.neutral.c70, bottomRight: theme.colors.neutral.c30 },
  },
];

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function contrastRGB(rgbVal: number, contrastVal: number) {
  return (rgbVal - 128) * contrastVal + 128;
}

// simutaneously apply grayscale and contrast to the image
function applyFilter(
  imageData: ImageData,
  contrastAmount: number,
  dither = true,
  bitsPerPixel: 1 | 4,
): { imageDataResult: Uint8ClampedArray; hexRawResult: string } {
  let hexRawResult = "";
  const filteredImageData = [];

  const data = imageData.data;

  // Determine number of gray levels based on bitsPerPixel
  const numLevelsOfGray = Math.pow(2, bitsPerPixel);
  const rgbStep = 255 / (numLevelsOfGray - 1);

  const { width, height } = imageData;

  const pixels256Colors: number[][] = Array.from(Array(height), () => Array(width));
  const pixelsNColors: number[][] = Array.from(Array(height), () => Array(width));

  for (let pxIndex = 0; pxIndex < data.length / 4; pxIndex += 1) {
    const x = pxIndex % width;
    const y = (pxIndex - x) / width;

    const [redIndex, greenIndex, blueIndex] = [4 * pxIndex, 4 * pxIndex + 1, 4 * pxIndex + 2];
    const gray256 = 0.299 * data[redIndex] + 0.587 * data[greenIndex] + 0.114 * data[blueIndex];

    /** gray rgb value after applying the contrast */
    pixels256Colors[y][x] = clamp(contrastRGB(gray256, contrastAmount), 0, 255);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldpixel = pixels256Colors[y][x];
      const posterizedGrayNColors = Math.floor(oldpixel / rgbStep);
      const posterizedGray256 = posterizedGrayNColors * rgbStep;
      /**
       * Floyd-Steinberg dithering
       * https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering
       *         x - 1  |   x    |  x + 1
       *   y            |   *    | 7 / 16
       * y + 1  3 / 16  | 5 / 16 | 1 / 16
       */
      const newpixel = posterizedGray256;
      pixels256Colors[y][x] = newpixel;
      if (dither) {
        const quantError = oldpixel - newpixel;
        if (x < width - 1) {
          pixels256Colors[y][x + 1] = Math.floor(pixels256Colors[y][x + 1] + quantError * (7 / 16));
        }
        if (x > 0 && y < height - 1) {
          pixels256Colors[y + 1][x - 1] = Math.floor(
            pixels256Colors[y + 1][x - 1] + quantError * (3 / 16),
          );
        }
        if (y < height - 1) {
          pixels256Colors[y + 1][x] = Math.floor(pixels256Colors[y + 1][x] + quantError * (5 / 16));
        }
        if (x < width - 1 && y < height - 1) {
          pixels256Colors[y + 1][x + 1] = Math.floor(
            pixels256Colors[y + 1][x + 1] + quantError * (1 / 16),
          );
        }
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

type ProcessImageArgs = {
  image: HTMLImageElement;
  /**
   * number >= 0
   *  - 0:  full black
   *  - 1:  original contrast
   *  - >1: more contrasted than the original
   * */
  contrast: number;
  bitsPerPixel: 1 | 4;
};

function processImage(args: ProcessImageArgs): ProcessorResult {
  const { image, contrast, bitsPerPixel } = args;
  const { context, canvas } = createCanvas(image);
  if (!context) throw Error("Context is null");
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { naturalHeight: height, naturalWidth: width } = image;
  // 2. applying filter to the image data
  const { imageDataResult: grayData, hexRawResult } = applyFilter(
    imageData,
    contrast,
    true,
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

export type Props = ImageBase64Data & {
  onError: (_: Error) => void;
  onResult: (_: ProcessorResult) => void;
  setLoading: (_: boolean) => void;
  onContrastChanged: (_: { index: number; value: number }) => void;
  deviceModelId: CLSSupportedDeviceModelId;
};

const ImageGrayscalePreview: React.FC<Props> = props => {
  const { onError, imageBase64DataUri, onResult, setLoading, onContrastChanged, deviceModelId } =
    props;
  const [contrastIndex, setContrastIndex] = useState<number>(0);
  const [sourceUriLoaded, setSourceUriLoaded] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ProcessorPreviewResult | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  const theme = useTheme();
  const contrasts = useMemo(() => getContrasts(theme), [theme]);

  useEffect(() => {
    onContrastChanged({ index: contrastIndex, value: contrasts[contrastIndex].val });
  }, [contrastIndex, contrasts, onContrastChanged]);

  useEffect(() => {
    if (sourceImageRef.current && sourceUriLoaded && sourceUriLoaded === imageBase64DataUri) {
      try {
        const { previewResult, rawResult } = processImage({
          image: sourceImageRef.current,
          contrast: contrasts[contrastIndex].val,
          bitsPerPixel: getScreenSpecs(deviceModelId).bitsPerPixel,
        });
        setPreviewResult(previewResult);
        onResult({ previewResult, rawResult });
        setLoading(false);
      } catch (e) {
        console.error(e);
        onError(new ImageProcessingError());
      }
    }
  }, [
    sourceUriLoaded,
    imageBase64DataUri,
    contrasts,
    onResult,
    sourceImageRef,
    setLoading,
    onError,
    contrastIndex,
    deviceModelId,
  ]);

  const handleSourceLoaded: React.ReactEventHandler<HTMLImageElement> = useCallback(
    e => {
      // @ts-expect-error why is src not on target even though we give it HTMLImageElement
      setSourceUriLoaded(e.target.src);
    },
    [setSourceUriLoaded],
  );

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <img
        ref={sourceImageRef}
        src={props.imageBase64DataUri}
        style={{ opacity: 0, position: "absolute", pointerEvents: "none" }}
        onLoad={handleSourceLoaded}
      />
      {previewResult ? (
        <FramedPicture
          frameConfig={getFramedPictureConfig("transfer", deviceModelId, theme.colors.palette.type)}
          source={previewResult?.imageBase64DataUri}
        />
      ) : null}
      <Flex alignSelf="center" flexDirection="row" mt={8} columnGap={2}>
        {contrasts.map(({ val, color }, index) => (
          <ContrastChoice
            key={val}
            onClick={() => setContrastIndex(index)}
            color={color}
            selected={contrastIndex === index}
            index={index}
          />
        ))}
      </Flex>
    </Flex>
  );
};

export default React.memo(ImageGrayscalePreview);
