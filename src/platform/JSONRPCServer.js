// @flow
import { useEffect, useRef, useCallback } from "react";
import {
  JSONRPCServer,
  JSONRPCServerAndClient,
  JSONRPCClient,
} from "json-rpc-2.0";

type LedgerLiveAPIHandlers = {};

type SendFunc = (request: any) => void;

export const useJSONRPCServer = (
  handlers: LedgerLiveAPIHandlers,
  send: SendFunc
) => {
  const serverRef: { current: null | typeof JSONRPCServerAndClient } = useRef(
    null
  );

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
