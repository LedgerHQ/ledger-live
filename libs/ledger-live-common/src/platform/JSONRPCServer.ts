import { useEffect, useRef, useCallback } from "react";
import {
  JSONRPCServer,
  JSONRPCServerAndClient,
  JSONRPCClient,
} from "json-rpc-2.0";
type LedgerLiveAPIHandlers = Record<string, (any) => any>;
type SendFunc = (request: any) => Promise<void>;
export const useJSONRPCServer = (
  handlers: LedgerLiveAPIHandlers,
  send: SendFunc
): Array<SendFunc> => {
  const serverRef: {
    current: null | JSONRPCServerAndClient;
  } = useRef(null);

  useEffect(() => {
    const server = new JSONRPCServerAndClient(
      new JSONRPCServer(),
      new JSONRPCClient(send)
    );
    const methodIds = Object.keys(handlers);
    methodIds.forEach((methodId: string) => {
      server.addMethod(methodId, handlers[methodId]);
    });
    serverRef.current = server;
  }, [send, handlers]);
  const receive = useCallback(async (request: any) => {
    if (serverRef.current) {
      await serverRef.current.receiveAndSend(request);
    }
  }, []);

  return [receive];
};
