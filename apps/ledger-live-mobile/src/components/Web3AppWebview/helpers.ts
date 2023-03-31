import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import {
  addParamsToURL,
  getClientHeaders,
} from "@ledgerhq/live-common/wallet-api/helpers";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { WebViewProps, WebView } from "react-native-webview";
import { useTheme } from "styled-components/native";
import { WebviewAPI, WebviewState } from "./types";

export const initialWebviewState: WebviewState = {
  url: "",
  canGoBack: false,
  canGoForward: false,
  title: "",
  loading: false,
};

type useWebviewStateParams = {
  manifest: AppManifest;
  inputs?: Record<string, string>;
};

export function useWebviewState(
  params: useWebviewStateParams,
  WebviewAPIRef: React.ForwardedRef<WebviewAPI>,
) {
  const webviewRef = useRef<WebView>(null);
  const { manifest, inputs } = params;

  const initialURL = useMemo(() => {
    const url = new URL(manifest.url);
    addParamsToURL(url, inputs);
    if (manifest.params) {
      url.searchParams.set("params", JSON.stringify(manifest.params));
    }
    return url.toString();
  }, [manifest, inputs]);

  const [state, setState] = useState<WebviewState>(initialWebviewState);

  useEffect(() => {
    setURI(initialURL);
  }, [initialURL]);

  const [currentURI, setURI] = useState(initialURL);
  const { theme } = useTheme();

  const source = useMemo(
    () => ({
      uri: currentURI,
      headers: getClientHeaders({
        client: "ledger-live-mobile",
        theme,
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentURI],
  );

  useImperativeHandle(
    WebviewAPIRef,
    () => {
      return {
        reload: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.reload();
        },
        goBack: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.goBack();
        },
        goForward: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.goForward();
        },
        loadURL: (url: string): void => {
          setURI(url);
        },
      };
    },
    [webviewRef],
  );

  const onLoad: Required<WebViewProps>["onLoad"] = useCallback(
    ({ nativeEvent }) => {
      setState({
        title: nativeEvent.title,
        url: nativeEvent.url,
        canGoBack: nativeEvent.canGoBack,
        canGoForward: nativeEvent.canGoForward,
        loading: nativeEvent.loading,
      });
    },
    [],
  );

  const onLoadStart: Required<WebViewProps>["onLoadStart"] = useCallback(
    ({ nativeEvent }) => {
      setState({
        title: nativeEvent.title,
        url: nativeEvent.url,
        canGoBack: nativeEvent.canGoBack,
        canGoForward: nativeEvent.canGoForward,
        loading: nativeEvent.loading,
      });
    },
    [],
  );

  const onLoadEnd: Required<WebViewProps>["onLoadEnd"] = useCallback(
    ({ nativeEvent }) => {
      setState({
        title: nativeEvent.title,
        url: nativeEvent.url,
        canGoBack: nativeEvent.canGoBack,
        canGoForward: nativeEvent.canGoForward,
        loading: nativeEvent.loading,
      });
    },
    [],
  );

  const onLoadProgress: Required<WebViewProps>["onLoadProgress"] = useCallback(
    ({ nativeEvent }) => {
      setState({
        title: nativeEvent.title,
        url: nativeEvent.url,
        canGoBack: nativeEvent.canGoBack,
        canGoForward: nativeEvent.canGoForward,
        loading: nativeEvent.loading,
      });
    },
    [],
  );

  const onNavigationStateChange: Required<WebViewProps>["onNavigationStateChange"] =
    useCallback(event => {
      setState({
        title: event.title,
        url: event.url,
        canGoBack: event.canGoBack,
        canGoForward: event.canGoForward,
        loading: event.loading,
      });
    }, []);

  const props: Partial<WebViewProps> = useMemo(
    () => ({
      onLoad,
      onLoadStart,
      onLoadEnd,
      onLoadProgress,
      onNavigationStateChange,
      source,
    }),
    [
      onLoad,
      onLoadEnd,
      onLoadProgress,
      onLoadStart,
      onNavigationStateChange,
      source,
    ],
  );

  return {
    webviewState: state,
    webviewProps: props,
    webviewRef,
  };
}
