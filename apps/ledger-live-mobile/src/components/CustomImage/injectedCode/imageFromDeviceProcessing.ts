declare global {
  interface Window {
    ReactNativeWebView: {
      postMessage(message: string): void;
    };
    reconstructImage: (width: number, height: number, hexData: string, bitsPerPixel: 1 | 4) => void;
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

  const postDataToWebView = (data: unknown) => {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };

  const logError = (error: Error) => {
    postDataToWebView({ type: "ERROR", payload: error.toString() });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const log = (...args: unknown[]) => {
    postDataToWebView({ type: "LOG", payload: JSON.stringify(args) });
  };

  /**
   * store functions as a property of window so we can access them easily after minification
   * */
  window.reconstructImage = (width, height, hexData, bitsPerPixel) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) return;

      const imageData: number[] = [];

      const numLevelsOfGray = Math.pow(2, bitsPerPixel);

      const rgbStep = 255 / (numLevelsOfGray - 1);

      const pixels256 = Array.from(Array(height), () => Array(width));

      hexData.split("").forEach((char, index) => {
        /** running from top right to bottom left, column after column */
        if (bitsPerPixel === 4) {
          const y = index % height;
          const x = width - 1 - (index - y) / height;
          const numericVal16Colors = Number.parseInt(char, 16);
          const numericVal256Colors = numericVal16Colors * rgbStep;
          pixels256[y][x] = numericVal256Colors;
        } else {
          // bitsPerPixel === 1
          const numericalVal = Number.parseInt(char, 16);
          // each hexadecimal character is 4 bits, so 4 pixels
          for (let i = 0; i < 4; i++) {
            const pixelIndex = index * 4 + i;
            if (pixelIndex >= width * height) break;

            const x = width - 1 - Math.floor(pixelIndex / height);
            const y = pixelIndex % height;

            // Extract bits from left to right (MSB first)
            const mask = 1 << (3 - i);
            const bit = numericalVal & mask ? 1 : 0;
            const pixelVal = bit ? 0 : 255; // Colors are inverted in this mode
            pixels256[y][x] = pixelVal;
          }
        }
      });

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const val = pixels256[y][x];
          imageData.push(val); // R
          imageData.push(val); // G
          imageData.push(val); // B
          imageData.push(255);
        }
      }

      context.putImageData(new ImageData(Uint8ClampedArray.from(imageData), width, height), 0, 0);

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

export const htmlPage = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
      ${injectedCode}
    </script>
  </head>
  <body>
  </body>
</html>
`;
