declare global {
  interface Window {
    ReactNativeWebView: any;
    processImage: (imgBase64: string) => void;
    setImageContrast: (val: number) => void;
    setAndApplyImageContrast: (val: number) => void;
    requestRawResult: () => void;
  }
}

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

  const DEBUG = false;

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

      if ((i === 0 || i === 1000) && DEBUG) {
        log([contrastedGray256, contrastedGray16]);
      }

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

  const postDataToWebView = (data: any) => {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };

  /** helper to log stuff in RN JS thread */
  const log = (data: any) => {
    postDataToWebView({ type: "LOG", payload: data });
  };

  const logError = (error: Error) => {
    postDataToWebView({ type: "ERROR", payload: error.toString() });
  };

  let image: any = null;

  /**
   * Hexadecimal representation of the final image.
   * The final image is grayscale with 16 levels of gray.
   * It has 1 char per pixel, each character being an hexadecimal value
   * between 0 and F (0 and 15).
   * This solution is chosen as it's the most straightforward way to stringify
   * the data of the image in a "compact" way.
   * */
  let rawResult = "";

  const computeResult = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");

      if (!context) return;

      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const { imageDataResult: grayData, hexRawResult } = applyFilter(
        imageData.data,
        contrast,
      );
      rawResult = hexRawResult;

      const grayCanvas = document.createElement("canvas");
      grayCanvas.width = image.width;
      grayCanvas.height = image.height;
      const grayContext = grayCanvas.getContext("2d");

      if (!grayContext) return;

      grayContext.putImageData(
        new ImageData(grayData, image.width, image.height), // eslint-disable-line no-undef
        0,
        0,
      );

      const grayScaleBase64 = grayCanvas.toDataURL();
      postDataToWebView({
        type: "BASE64_RESULT",
        payload: {
          base64Data: grayScaleBase64,
          width: image.width,
          height: image.height,
        },
      });
    } catch (e) {
      if (e instanceof Error) {
        logError(e);
        console.error(e);
      }
    }
  };

  /**
   * store functions as a property of window so we can access them easily after minification
   * */
  window.processImage = imgBase64 => {
    image = new Image(); // eslint-disable-line no-undef

    image.onload = () => {
      computeResult();
    };

    image.src = imgBase64;
  };

  let contrast = 1;

  window.setImageContrast = val => {
    contrast = val;
  };

  window.setAndApplyImageContrast = val => {
    window.setImageContrast(val);
    if (image) computeResult();
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
        hexData: rawResult,
        width: image.width,
        height: image.height,
      },
    });
  };
}

function getFunctionBody(str: string) {
  return str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
}

export const injectedCode = getFunctionBody(codeToInject.toString());
