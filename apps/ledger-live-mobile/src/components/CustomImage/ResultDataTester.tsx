import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { WebView } from "react-native-webview";
import {
  WebViewErrorEvent,
  WebViewMessageEvent,
} from "react-native-webview/lib/WebViewTypes";
import { ImageProcessingError } from "@ledgerhq/live-common/customImage/errors";
import { ProcessorPreviewResult, ProcessorRawResult } from "./ImageProcessor";
import { injectedCode } from "./injectedCode/resultDataTesting";
import { InjectedCodeDebugger } from "./InjectedCodeDebugger";

export type Props = ProcessorRawResult & {
  onError: (_: Error) => void;
  onPreviewResult: (_: ProcessorPreviewResult) => void;
  debug?: boolean;
};

/**
 * Component to do reconstruct a 16 levels of gray image from an hexadecimal
 * representation of it.
 *
 * It:
 *  - takes as an input an image hex representation.
 *  - displays nothing (except for a warning in __DEV__ if the injected code is
 *  not correctly injected)
 *  - outputs a preview of the result in base64 data uri
 *
 * Under the hood, this is implemented with a webview and some code injected in
 * it as it gives access to some web APIs (Canvas & Image) to do the processing.
 *
 * */
export default class ResultDataTester extends React.Component<Props> {
  webViewRef: WebView | null = null;

  componentDidUpdate(prevProps: Props) {
    if (prevProps.hexData !== this.props.hexData) {
      this.computeResult();
    }
  }

  handleWebViewMessage = ({ nativeEvent: { data } }: WebViewMessageEvent) => {
    const { onError, onPreviewResult } = this.props;
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
      default:
        break;
    }
  };

  injectJavaScript = (script: string) => {
    this.webViewRef?.injectJavaScript(script);
  };

  processImage = () => {
    const { hexData, width, height } = this.props;
    this.injectJavaScript(
      `window.reconstructImage(${width}, ${height}, "${hexData}");`,
    );
  };

  computeResult = () => {
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
        <InjectedCodeDebugger
          debug={debug}
          injectedCode={injectedCode}
          filename="resultDataTesting.ts"
        />
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
