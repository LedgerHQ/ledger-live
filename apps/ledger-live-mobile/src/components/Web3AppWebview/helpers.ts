import { useMemo, useState } from "react";
import { WebViewProps } from "react-native-webview";
import { WebviewState } from "./types";

const initialState: WebviewState = {
  url: "",
  canGoBack: false,
  canGoForward: false,
  title: "",
  loading: false,
};

type WebviewMethods = Partial<WebViewProps>;

export function useWebviewState() {
  const [state, setState] = useState<WebviewState>(initialState);

  const methods: WebviewMethods = useMemo(
    () => ({
      onLoad: ({ nativeEvent }) => {
        setState({
          title: nativeEvent.title,
          url: nativeEvent.url,
          canGoBack: nativeEvent.canGoBack,
          canGoForward: nativeEvent.canGoForward,
          loading: nativeEvent.loading,
        });
      },
      onLoadStart: ({ nativeEvent }) => {
        setState({
          title: nativeEvent.title,
          url: nativeEvent.url,
          canGoBack: nativeEvent.canGoBack,
          canGoForward: nativeEvent.canGoForward,
          loading: nativeEvent.loading,
        });
      },
      onLoadEnd: ({ nativeEvent }) => {
        setState({
          title: nativeEvent.title,
          url: nativeEvent.url,
          canGoBack: nativeEvent.canGoBack,
          canGoForward: nativeEvent.canGoForward,
          loading: nativeEvent.loading,
        });
      },
      onLoadProgress: ({ nativeEvent }) => {
        setState({
          title: nativeEvent.title,
          url: nativeEvent.url,
          canGoBack: nativeEvent.canGoBack,
          canGoForward: nativeEvent.canGoForward,
          loading: nativeEvent.loading,
        });
      },
      onNavigationStateChange: event => {
        setState({
          title: event.title,
          url: event.url,
          canGoBack: event.canGoBack,
          canGoForward: event.canGoForward,
          loading: event.loading,
        });
      },
    }),
    [],
  );

  return {
    webviewState: state,
    webviewProps: methods,
  };
}
