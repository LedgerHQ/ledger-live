declare global {
  interface Window {
    ReactNativeWebView: any;
    reconstructImage: (width: number, height: number, hexData: string) => void;
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

  const postDataToWebView = (data: any) => {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };

  const logError = (error: Error) => {
    postDataToWebView({ type: "ERROR", payload: error.toString() });
  };

  /**
   * store functions as a property of window so we can access them easily after minification
   * */
  window.reconstructImage = (width, height, hexData) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) return;

      const imageData: number[] = [];

      const numLevelsOfGray = 16;
      const rgbStep = 255 / (numLevelsOfGray - 1);
      hexData.split("").forEach(char => {
        const numericVal16 = Number.parseInt(char, 16);
        const numericVal256 = numericVal16 * rgbStep;
        imageData.push(numericVal256); // R
        imageData.push(numericVal256); // G
        imageData.push(numericVal256); // B
        imageData.push(255);
      });

      context.putImageData(
        new ImageData(Uint8ClampedArray.from(imageData), width, height), // eslint-disable-line no-undef
        0,
        0,
      );

      const grayScaleBase64 = canvas.toDataURL();
      postDataToWebView({
        type: "BASE64_RESULT",
        payload: {
          base64Data: grayScaleBase64,
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
}

function getFunctionBody(str: string) {
  return str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
}

export const injectedCode = getFunctionBody(codeToInject.toString());
