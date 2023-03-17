import { RefObject, useCallback, useEffect, useState } from "react";
import { WebviewState, WebviewTag } from "./types";

const initialState: WebviewState = {
  url: "",
  canGoBack: false,
  canGoForward: false,
  title: "",
  loading: false,
};

export function useWebviewState(webviewRef: RefObject<WebviewTag>) {
  const [state, setState] = useState<WebviewState>(initialState);
  const [isMounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, [isMounted]);

  const handlePageTitleUpdated = useCallback((event: Electron.PageTitleUpdatedEvent) => {
    setState(oldState => ({
      ...oldState,
      title: event.title,
    }));
  }, []);

  const handleDidNavigateInPage = useCallback(
    (event: Electron.DidNavigateInPageEvent) => {
      const webview = webviewRef.current;

      if (!webview) {
        return;
      }

      setState(oldState => ({
        ...oldState,
        url: event.url,
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
      }));
    },
    [webviewRef],
  );

  const handleDidNavigate = useCallback(
    (event: Electron.DidNavigateEvent) => {
      const webview = webviewRef.current;

      if (!webview) {
        return;
      }

      setState(oldState => ({
        ...oldState,
        url: event.url,
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
      }));
    },
    [webviewRef],
  );

  const handleDidStartLoading = useCallback(() => {
    setState(oldState => ({
      ...oldState,
      loading: true,
    }));
  }, []);

  const handleDidStopLoading = useCallback(() => {
    setState(oldState => ({
      ...oldState,
      loading: false,
    }));
  }, []);

  const handleDomReady = useCallback(() => {
    const webview = webviewRef.current;

    if (!webview) {
      return;
    }

    setState({
      url: webview.getURL(),
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      title: webview.getTitle(),
      loading: webview.isLoading(),
    });
  }, [webviewRef]);

  useEffect(() => {
    const webview = webviewRef.current;

    if (!isMounted || !webview) {
      return;
    }

    webview.addEventListener("page-title-updated", handlePageTitleUpdated);
    webview.addEventListener("did-navigate", handleDidNavigate);
    webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
    webview.addEventListener("did-start-loading", handleDidStartLoading);
    webview.addEventListener("did-stop-loading", handleDidStopLoading);
    webview.addEventListener("dom-ready", handleDomReady);

    return () => {
      webview.removeEventListener("page-title-updated", handlePageTitleUpdated);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigateInPage);
      webview.removeEventListener("did-start-loading", handleDidStartLoading);
      webview.removeEventListener("did-stop-loading", handleDidStopLoading);
      webview.removeEventListener("dom-ready", handleDomReady);
    };
  }, [
    handleDidNavigate,
    handleDidNavigateInPage,
    handleDidStartLoading,
    handleDidStopLoading,
    handlePageTitleUpdated,
    handleDomReady,
    webviewRef,
    isMounted,
  ]);

  return {
    webviewState: state,
  };
}
