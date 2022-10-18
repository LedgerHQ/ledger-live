import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { WebView } from "react-native-webview";
import {
  WebViewErrorEvent,
  WebViewMessageEvent,
} from "react-native-webview/lib/WebViewTypes";
import { ImageProcessingError } from "@ledgerhq/live-common/customImage/errors";
import { injectedCode } from "./injectedCode/imageProcessing";
import { InjectedCodeDebugger } from "./InjectedCodeDebugger";
import { ImageBase64Data, ImageDimensions } from "./types";

export type ProcessorPreviewResult = ImageBase64Data & ImageDimensions;

export type ProcessorRawResult = { hexData: string } & ImageDimensions;

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
};

/**
 * Component to do some processing on an image (apply grayscale with 16 gray
 * levels, apply some contrast, output a preview and a hex reprensentation of
 * the result)
 *
 * It:
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
   * NB: We are a class component here because we need to access some methods from
   * the parent using a ref.
   */

  webViewRef: WebView | null = null;

  componentDidUpdate(prevProps: Props) {
    if (prevProps.contrast !== this.props.contrast) this.setAndApplyContrast();
    if (prevProps.imageBase64DataUri !== this.props.imageBase64DataUri)
      this.computeResult();
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
        if (
          !payload.width ||
          !payload.height ||
          !payload.hexData ||
          payload.hexData.length !== payload.width * payload.height
        ) {
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
    const { imageBase64DataUri } = this.props;
    this.injectJavaScript(`window.processImage("${imageBase64DataUri}");`);
  };

  setContrast = () => {
    const { contrast } = this.props;
    this.injectJavaScript(`window.setImageContrast(${contrast});`);
  };

  setAndApplyContrast = () => {
    const { contrast } = this.props;
    this.injectJavaScript(`window.setAndApplyImageContrast(${contrast})`);
  };

  requestRawResult = () => {
    this.injectJavaScript("window.requestRawResult();");
  };

  computeResult = () => {
    this.setContrast();
    this.processImage();
  };

  handleWebViewLoaded = () => {
    this.computeResult();
  };

  reloadWebView = () => {
    this.webViewRef?.reload();
  };

  handleWebViewError = ({ nativeEvent }: WebViewErrorEvent) => {
    const { onError } = this.props;
    console.error(nativeEvent);
    onError(new ImageProcessingError());
  };

  render() {
    const { debug = false } = this.props;
    return (
      <>
        <InjectedCodeDebugger debug={debug} injectedCode={injectedCode} />
        <Flex flex={0}>
          <WebView
            ref={c => (this.webViewRef = c)}
            injectedJavaScript={injectedCode}
            androidLayerType="software"
            androidHardwareAccelerationDisabled
            onError={this.handleWebViewError}
            onLoadEnd={this.handleWebViewLoaded}
            onMessage={this.handleWebViewMessage}
          />
        </Flex>
      </>
    );
  }
}
