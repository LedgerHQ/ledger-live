import { WalletAPIServer } from "@ledgerhq/wallet-api-server";
import { handlers } from "./server";

type RpcAnswer = { result?: unknown; error?: { code: number; message?: string } };

// Through the real Wallet API server, unlike server.test.ts: the JSON-RPC answer the live app gets.
function setup(cancelSignatures: (requestGroupId: string) => number) {
  const signatureCancelHandlers = handlers({ cancelSignatures });
  const answers: string[] = [];
  const transport = {
    onMessage: undefined as ((message: string) => void) | undefined,
    send: (message: string) => answers.push(message),
  };
  const config = {
    appId: "ledger-wallet-connect",
    userId: "user",
    tracking: false,
    wallet: { name: "test-wallet", version: "1.0.0" },
  } as unknown as ConstructorParameters<typeof WalletAPIServer>[1];
  new WalletAPIServer(transport, config, undefined, signatureCancelHandlers).setPermissions({
    methodIds: Object.keys(signatureCancelHandlers),
  });

  return async (params: unknown): Promise<RpcAnswer> => {
    transport.onMessage?.(
      JSON.stringify({ jsonrpc: "2.0", id: "1", method: "custom.signature.cancel", params }),
    );
    await new Promise(setImmediate);
    return JSON.parse(answers[0]) as RpcAnswer;
  };
}

describe("custom.signature.cancel through the Wallet API server", () => {
  it("answers how many sign requests of the group were cancelled", async () => {
    const cancelSignatures = jest.fn().mockReturnValue(2);
    const cancel = setup(cancelSignatures);

    const answer = await cancel({ requestGroupId: "topic-1" });

    expect(cancelSignatures).toHaveBeenCalledWith("topic-1");
    expect(answer.result).toEqual({ cancelled: 2 });
  });

  it("answers an error, without cancelling, when the request group is missing", async () => {
    const cancelSignatures = jest.fn();
    const cancel = setup(cancelSignatures);

    const answer = await cancel({});

    expect(answer.error).toBeDefined();
    expect(cancelSignatures).not.toHaveBeenCalled();
  });
});
