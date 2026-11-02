import { useEffect } from "react";
import { JSONRPCServer, JSONRPCServerAndClient, JSONRPCClient } from "json-rpc-2.0";
import type { BridgeSession } from "../wallet-api/bridgeSession";
/** Each handler gets the session of its request, to drop work that outlives it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LedgerLiveAPIHandlers = Record<string, (params: any, session: BridgeSession) => any>;

/**
 * Serves the Platform API on a bridge session: a new server runs for each session (i.e. per
 * main-frame origin), replies only go to the session origin, and pending requests are rejected
 * once the session is closed. The webview host feeds the session the messages it accepted.
 */
export const useJSONRPCServer = (handlers: LedgerLiveAPIHandlers, session: BridgeSession): void => {
  useEffect(() => {
    const server = new JSONRPCServerAndClient(
      new JSONRPCServer(),
      new JSONRPCClient(payload => {
        session.send(JSON.stringify(payload));
        return Promise.resolve();
      }),
    );
    Object.keys(handlers).forEach((methodId: string) => {
      server.addMethod(methodId, params =>
        session.cancelOnClose(handlers[methodId](params, session)),
      );
    });
    session.onMessage = message => {
      let payload: unknown;
      try {
        payload = JSON.parse(message);
      } catch {
        return;
      }
      void server.receiveAndSend(payload as Parameters<typeof server.receiveAndSend>[0]);
    };
    session.activate();
  }, [handlers, session]);
};
