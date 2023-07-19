import { useCallback, useEffect, useRef } from "react";
import { WindowMessageTransport, RpcResponse } from "@ledgerhq/wallet-api-client";

type PendingRequests = Record<string, (response: RpcResponse) => void>;

export function useE2EInjection() {
  const queue = useRef<PendingRequests>({});
  const transport = useRef(new WindowMessageTransport());

  const send = useCallback(async jsonStr => {
    const { id } = JSON.parse(jsonStr);

    const promise = new Promise(resolve => {
      queue.current[id] = resolve;
      transport.current.send(jsonStr);
    });

    // if mobile
    if (window.ReactNativeWebView) {
      const response = await promise;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "e2eTest", payload: response }));
    }

    return promise;
  }, []);

  useEffect(() => {
    transport.current.connect();
    transport.current.onMessage = (msgStr: string) => {
      const msg = JSON.parse(msgStr);
      if (!msg.id) return;

      const resolve = queue.current[msg.id];
      if (!resolve) return;

      resolve(msg);
      delete queue.current[msg.id];
    };

    window.ledger = {
      // to avoid overriding other fields
      ...window.ledger,
      e2e: {
        ...window.ledger?.e2e,
        walletApi: {
          send,
        },
      },
    };
  }, [send]);
}
