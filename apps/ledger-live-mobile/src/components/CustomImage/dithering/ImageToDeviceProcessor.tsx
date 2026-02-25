import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { ImageProcessingError } from "@ledgerhq/live-common/customImage/errors";
import { injectedCode, htmlPage } from "./imageToDeviceProcessing";
import { InjectedCodeDebugger } from "../InjectedCodeDebugger";
import { ImageBase64Data } from "../types";
import { DitheringAlgorithm, ProcessorPreviewResult, ProcessorRawResult } from "./types";

export type Props = ImageBase64Data & {
  onError: (_: Error) => void;
  onPreviewResult: (_: ProcessorPreviewResult) => void;
  onRawResult: (_: ProcessorRawResult) => void;
  /**
   * number >= 0
   *  - 0:  full black
   *  - 1:  original contrast
   *  - >1: more contrasted than the original
   * */
  contrast: number;
  debug?: boolean;
  bitsPerPixel: 1 | 4;
  ditheringAlgorithm: DitheringAlgorithm;
};

/**
 * Component to do some processing on an image (apply grayscale with 16 gray
 * levels, apply some contrast, output a preview and a hex reprensentation of
 * the result)
 *
 * It:
 *
 *  - takes as an input an image base64 data & a contrast value as an input
 *  - displays nothing (except for a warning in __DEV__ if the injected code is
 *  not correctly injected)
 *  - outputs a preview of the result in base64 data uri
 *  - on user confirmation (call `ref.requestRawResult()`) it outputs the raw
 *  result which is a hex representation of the 16 levels of gray image.
 *
 *
 * Under the hood, this is implemented with a webview and some code injected in
 * it as it gives access to some web APIs (Canvas & Image) to do the processing.
 *
 * */
export default class ImageProcessor extends React.Component<Props> {
  /**
   *
   * NB: We are a class component here because we need to access some methods from
   * the parent using a ref.
   */

  webViewRef: WebView | null = null;

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.contrast !== this.props.contrast ||
      prevProps.ditheringAlgorithm !== this.props.ditheringAlgorithm
    )
      this.setAndApplyContrastAndDitheringAlgorithm();
    if (prevProps.imageBase64DataUri !== this.props.imageBase64DataUri) this.computeResult();
  }

  handleWebViewMessage = ({ nativeEvent: { data } }: WebViewMessageEvent) => {
    const { onError, onPreviewResult, onRawResult } = this.props;
    const { type, payload } = JSON.parse(data);
    switch (type) {
      case "LOG":
        __DEV__ && console.log("WEBVIEWLOG:", payload); // eslint-disable-line no-console
        break;
      case "ERROR":
        __DEV__ && console.error(payload);
        onError(new ImageProcessingError());
        break;
      case "BASE64_RESULT":
        if (!payload.width || !payload.height || !payload.base64Data) {
          onError(new ImageProcessingError());
          break;
        }
        onPreviewResult({
          width: payload.width,
          height: payload.height,
          imageBase64DataUri: payload.base64Data,
        });
        break;
      case "RAW_RESULT":
        if (!payload.width || !payload.height || !payload.hexData) {
          onError(new ImageProcessingError());
          break;
        }
        onRawResult({
          width: payload.width,
          height: payload.height,
          hexData: payload.hexData,
        });
        break;
      default:
        break;
    }
  };

  injectJavaScript = (script: string) => {
    this.webViewRef?.injectJavaScript(script);
  };

  processImage = () => {
    const { imageBase64DataUri, bitsPerPixel, ditheringAlgorithm } = this.props;
    this.injectJavaScript(
      `window.processImage("${imageBase64DataUri}", ${bitsPerPixel}, "${ditheringAlgorithm}");`,
    );
  };

  setContrastAndDitheringAlgorithm = () => {
    const { contrast, ditheringAlgorithm } = this.props;
    this.injectJavaScript(
      `window.setImageContrastAndDitheringAlgorithm(${contrast}, "${ditheringAlgorithm}");`,
    );
  };

  setAndApplyContrastAndDitheringAlgorithm = () => {
    const { contrast, ditheringAlgorithm } = this.props;
    this.injectJavaScript(
      `window.setAndApplyImageContrastAndDitheringAlgorithm(${contrast}, "${ditheringAlgorithm}");`,
    );
  };

  requestRawResult = () => {
    this.injectJavaScript("window.requestRawResult();");
  };

  computeResult = () => {
    this.setContrastAndDitheringAlgorithm();
    this.processImage();
  };

  handleWebViewLoaded = () => {
    this.computeResult();
  };

  reloadWebView = () => {
    this.webViewRef?.reload();
  };

  handleWebViewError = () => {
    const { onError } = this.props;
    onError(new ImageProcessingError());
  };

  render() {
    const { debug = false } = this.props;
    return (
      <>
        <InjectedCodeDebugger
          debug={debug}
          injectedCode={injectedCode}
          filename="imageToDeviceProcessing.ts"
        />
        <Flex flex={0}>
          <WebView
            ref={c => {
              this.webViewRef = c;
            }}
            androidLayerType="software"
            onError={this.handleWebViewError}
            onLoadEnd={this.handleWebViewLoaded}
            onMessage={this.handleWebViewMessage}
            originWhitelist={["*"]}
            source={{ html: htmlPage }}
            webviewDebuggingEnabled={__DEV__}
          />
        </Flex>
      </>
    );
  }
}
