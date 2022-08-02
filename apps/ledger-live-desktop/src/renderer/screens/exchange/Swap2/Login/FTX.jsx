// @flow

import React, { useRef, useMemo, useCallback, useEffect } from "react";

import type { FTXProviders } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { getFTXURL } from "@ledgerhq/live-common/exchange/swap/utils/index";

import SwapConnectWidget from "../SwapConnectWidget";

type Props = { onClose: Function, provider: FTXProviders };

const FTXLogin = ({ onClose, provider }: Props) => {
  const url = useMemo(() => getFTXURL({ type: "login", provider }), [provider]);

  const webviewRef = useRef(null);

  const handleExecuteJavaScript = useCallback(() => {
    const webview = webviewRef.current;
    webview.executeJavaScript(`localStorage.setItem('authToken', "")`);
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview) {
      webview.addEventListener("did-start-loading", handleExecuteJavaScript);
    }

    return () => {
      if (webview) {
        webview.removeEventListener("did-start-loading", handleExecuteJavaScript);
      }
    };
  }, [handleExecuteJavaScript]);

  return <SwapConnectWidget provider={provider} onClose={onClose} url={url} ref={webviewRef} />;
};

export default FTXLogin;
