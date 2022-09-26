declare global {
  interface Window {
    ReactNativeWebView: any;
    /* eslint-disable no-unused-vars */
    processImage: (imgBase64: string) => void;
    setImageContrast: (val: number) => void;
    setAndApplyImageContrast: (val: number) => void;
    /* eslint-enable no-unused-vars */
    requestRawResult: () => void;
  }
}

type ComputationResult = {
  base64Data: string;
  width: number;
  height: number;
  hexRawResult: string;
};

/**
 * This function is meant to be stringified and its body injected in the webview
 * It allows us to have access to APIs that are available in browsers and not
 * in React Native (here Canvas & Image).
 * */
function codeToInject() {
  /**
   * The following line is a hermes directive that allows
   * Function.prototype.toString() to return clear stringified code that can
   * thus be injected in a webview.
   *
   * ⚠️ IN DEBUG this doesn't work until you hot reload this file (just save the file and it will work)
   * see https://github.com/facebook/hermes/issues/612
   *  */

  "show source";

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
  ): { imageDataResult: Uint8ClampedArray; hexRawResult: string } {
    let hexRawResult = "";
    const filteredImageData = [];

    const data = imageData.data;

    const numLevelsOfGray = 16;
    const rgbStep = 255 / (numLevelsOfGray - 1);

    const { width, height } = imageData;

    const pixels256: number[][] = Array.from(Array(height), () => Array(width));
    const pixels16: number[][] = Array.from(Array(height), () => Array(width));

    for (let pxIndex = 0; pxIndex < data.length / 4; pxIndex += 1) {
      const x = pxIndex % width;
      const y = (pxIndex - x) / width;

      const [redIndex, greenIndex, blueIndex] = [
        4 * pxIndex,
        4 * pxIndex + 1,
        4 * pxIndex + 2,
      ];
      const gray256 =
        0.299 * data[redIndex] +
        0.587 * data[greenIndex] +
        0.114 * data[blueIndex];

      /** gray rgb value after applying the contrast */
      pixels256[y][x] = clamp(contrastRGB(gray256, contrastAmount), 0, 255);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const oldpixel = pixels256[y][x];
        const posterizedGray16 = Math.floor(oldpixel / rgbStep);
        const posterizedGray256 = posterizedGray16 * rgbStep;
        /**
         * Floyd-Steinberg dithering
         * https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering
         *         x - 1  |   x    |  x + 1
         *   y            |   *    | 7 / 16
         * y + 1  3 / 16  | 5 / 16 | 1 / 16
         */
        const newpixel = posterizedGray256;
        pixels256[y][x] = newpixel;
        if (dither) {
          const quantError = oldpixel - newpixel;
          if (x < width - 1) {
            pixels256[y][x + 1] = Math.floor(
              pixels256[y][x + 1] + quantError * (7 / 16),
            );
          }
          if (x > 0 && y < height - 1) {
            pixels256[y + 1][x - 1] = Math.floor(
              pixels256[y + 1][x - 1] + quantError * (3 / 16),
            );
          }
          if (y < height - 1) {
            pixels256[y + 1][x] = Math.floor(
              pixels256[y + 1][x] + quantError * (5 / 16),
            );
          }
          if (x < width - 1 && y < height - 1) {
            pixels256[y + 1][x + 1] = Math.floor(
              pixels256[y + 1][x + 1] + quantError * (1 / 16),
            );
          }
        }

        const val16 = clamp(Math.floor(pixels256[y][x] / rgbStep), 0, 16 - 1);
        pixels16[y][x] = val16;
        /** gray rgb value after applying the contrast, in [0,255] */
        const val256 = val16 * rgbStep;
        filteredImageData.push(val256); // R
        filteredImageData.push(val256); // G
        filteredImageData.push(val256); // B
        filteredImageData.push(255); // alpha
      }
    }

    // Raw data -> by column, from right to left, from top to bottom
    for (let x = width - 1; x >= 0; x--) {
      for (let y = 0; y < height; y++) {
        const val16 = pixels16[y][x];
        const grayHex = val16.toString(16);
        hexRawResult = hexRawResult.concat(grayHex);
      }
    }

    return {
      imageDataResult: Uint8ClampedArray.from(filteredImageData),
      hexRawResult,
    };
  }

  function createCanvas(image: HTMLImageElement): {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
  } {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    return { canvas, context };
  }

  function computeResult(
    image: HTMLImageElement,
    contrastAmount: number,
  ): ComputationResult | null {
    // 1. drawing image in a canvas & getting its data
    const { canvas, context } = createCanvas(image);
    if (!context) return null;
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // 2. applying filter to the image data
    const { imageDataResult: grayData, hexRawResult } = applyFilter(
      imageData,
      contrastAmount,
    );

    // 3. putting the result in canvas
    context.putImageData(
      new ImageData(grayData, image.width, image.height), // eslint-disable-line no-undef
      0,
      0,
    );

    const grayScaleBase64 = canvas.toDataURL();
    return {
      base64Data: grayScaleBase64,
      width: image.width,
      height: image.height,
      hexRawResult,
    };
  }

  /**
   *
   *
   *
   *
   * INTERFACING WITH REACT NATIVE WEBVIEW
   *
   * - declaring some helpers to post messages to the WebView.
   * - using a global temporary variable to store intermediary results
   * - storing some functions as properties of the window object so they are
   *   still accessible after code minification.
   * */

  const postDataToWebView = (data: any) => {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const log = (data: any) => {
    postDataToWebView({ type: "LOG", payload: data });
  };

  const logError = (error: Error) => {
    postDataToWebView({ type: "ERROR", payload: error.toString() });
  };

  type Store = {
    image: HTMLImageElement;
    rawResult: string;
    contrast: number;
  };

  let tmpStore: Store;
  const initTmpStore = () => {
    tmpStore = {
      image: new Image(), // eslint-disable-line no-undef
      rawResult: "",
      contrast: 1,
    };
  };
  initTmpStore();

  const computeResultAndPostData = () => {
    try {
      const res = computeResult(tmpStore.image, tmpStore.contrast);
      if (res === null) return;
      const { base64Data, width, height, hexRawResult } = res;
      tmpStore.rawResult = hexRawResult;

      postDataToWebView({
        type: "BASE64_RESULT",
        payload: {
          base64Data,
          width,
          height,
        },
      });
    } catch (e) {
      if (e instanceof Error) {
        logError(e);
        console.error(e);
      }
    }
  };

  window.processImage = imgBase64 => {
    initTmpStore();
    tmpStore.image.onload = () => {
      computeResultAndPostData();
    };
    tmpStore.image.src = imgBase64;
  };

  window.setImageContrast = val => {
    tmpStore.contrast = val;
  };

  window.setAndApplyImageContrast = val => {
    window.setImageContrast(val);
    if (tmpStore.image) computeResultAndPostData();
  };

  window.requestRawResult = () => {
    /**
     * stringifying and then parsing rawResult is a heavy operation that
     * takes a lot of time so we should we should do this only once the user is
     * satisfied with the preview.
     */
    postDataToWebView({
      type: "RAW_RESULT",
      payload: {
        hexData: tmpStore.rawResult,
        width: tmpStore.image.width,
        height: tmpStore.image.height,
      },
    });
  };
}

function getFunctionBody(str: string) {
  return str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
}

export const injectedCode = getFunctionBody(codeToInject.toString());
