import React, { useRef, useState, useCallback, useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { zkProofHtmlPage } from "../utils/zkProofHtml";

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

let requestIdCounter = 0;

export function useZkProofWebView() {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === "ready") {
      setIsReady(true);
      return;
    }

    const pending = pendingRequests.current.get(data.id);
    if (!pending) return;
    pendingRequests.current.delete(data.id);

    if (data.type === "error") {
      pending.reject(new Error(data.payload));
    } else {
      pending.resolve(data.payload);
    }
  }, []);

  const sendCommand = useCallback(
    (command: string, params: Record<string, unknown>): Promise<any> => {
      return new Promise((resolve, reject) => {
        const id = `zk_${++requestIdCounter}`;
        pendingRequests.current.set(id, { resolve, reject });

        const message = JSON.stringify({ id, command, params });
        const escaped = message.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        webViewRef.current?.injectJavaScript(
          `window.executeCommand('${escaped}'); true;`,
        );

        setTimeout(() => {
          if (pendingRequests.current.has(id)) {
            pendingRequests.current.delete(id);
            reject(new Error("ZK proof generation timed out"));
          }
        }, 30000);
      });
    },
    [],
  );

  const generateProof = useCallback(
    async (input: { dateOfBirth: number; currentDate: number; minimumAge: number }) => {
      if (!isReady) throw new Error("ZK WebView not ready");
      return sendCommand("generateProof", input);
    },
    [isReady, sendCommand],
  );

  const verifyProof = useCallback(
    async (proof: object, publicSignals: string[]): Promise<boolean> => {
      if (!isReady) throw new Error("ZK WebView not ready");
      const result = await sendCommand("verifyProof", { proof, publicSignals });
      return result.valid;
    },
    [isReady, sendCommand],
  );

  const webViewElement = useMemo(
    () => (
      <Flex style={{ height: 0, width: 0, overflow: "hidden" }}>
        <WebView
          ref={webViewRef}
          source={{ html: zkProofHtmlPage }}
          onMessage={handleMessage}
          originWhitelist={["*"]}
          javaScriptEnabled
          webviewDebuggingEnabled={__DEV__}
        />
      </Flex>
    ),
    [handleMessage],
  );

  return { webViewElement, isReady, generateProof, verifyProof };
}
