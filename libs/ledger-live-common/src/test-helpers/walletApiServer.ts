import { WalletAPIServer } from "@ledgerhq/wallet-api-server";
import type { Transport } from "@ledgerhq/wallet-api-core";
import type { WalletAPICustomHandlers } from "../wallet-api/types";

export type RpcResponse = {
  id: string;
  result?: unknown;
  error?: { code: number; message: string; data?: { code?: string; data?: unknown } };
};

/** A wallet API server with the custom handlers of a host, and a live app that sends it requests. */
export function connectLiveApp(customHandlers: WalletAPICustomHandlers, permissions: string[]) {
  const answers: RpcResponse[] = [];
  let onAnswer: (() => void) | undefined;
  const transport: Transport = {
    onMessage: undefined,
    send: message => {
      answers.push(JSON.parse(message));
      onAnswer?.();
    },
  };
  const server = new WalletAPIServer(
    transport,
    { userId: "user", tracking: false, wallet: { name: "test", version: "1" }, appId: "live-app" },
    undefined,
    customHandlers,
  );
  server.setPermissions({ methodIds: permissions });

  return {
    async call(method: string, params?: unknown): Promise<RpcResponse> {
      const answered = new Promise<void>(resolve => {
        onAnswer = resolve;
      });
      transport.onMessage?.(JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }));
      await answered;
      return answers[answers.length - 1];
    },
  };
}
