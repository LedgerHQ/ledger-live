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

  function clampRGB(val: number) {
    return Math.min(255, Math.max(val, 0));
  }

  function contrastRGB(rgbVal: number, contrastVal: number) {
    return (rgbVal - 128) * contrastVal + 128;
  }

  // simutaneously apply grayscale and contrast to the image
  function applyFilter(
    imageData: Uint8ClampedArray,
    contrastAmount: number,
  ): { imageDataResult: Uint8ClampedArray; hexRawResult: string } {
    let hexRawResult = "";
    const filteredImageData = [];

    const numLevelsOfGray = 16;
    const rgbStep = 255 / (numLevelsOfGray - 1);

    for (let i = 0; i < imageData.length; i += 4) {
      /** gray rgb value for the pixel, in [0, 255] */
      const gray256 =
        0.299 * imageData[i] +
        0.587 * imageData[i + 1] +
        0.114 * imageData[i + 2];

      /** gray rgb value after applying the contrast, in [0, 15] */
      const contrastedGray16 = Math.floor(
        clampRGB(contrastRGB(gray256, contrastAmount)) / rgbStep,
      );

      /** gray rgb value after applying the contrast, in [0,255] */
      const contrastedGray256 = contrastedGray16 * rgbStep;

      const grayHex = contrastedGray16.toString(16);

      hexRawResult = hexRawResult.concat(grayHex);
      // adding hexadecimal value of this pixel

      filteredImageData.push(contrastedGray256);
      filteredImageData.push(contrastedGray256);
      filteredImageData.push(contrastedGray256);
      // push 3 bytes for color (all the same == gray)

      filteredImageData.push(255);
      // push alpha = max = 255
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
      imageData.data,
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
