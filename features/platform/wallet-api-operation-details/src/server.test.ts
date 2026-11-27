import { WalletAPIServer } from "@ledgerhq/wallet-api-server";
import { OperationDetailsOperationNotFound } from "./errors";
import { handlers, type OperationDetailsUiHooks } from "./server";

type RpcAnswer = { result?: unknown; error?: { code: number; data?: unknown } };

const WALLET_ACCOUNT_ID = "b6a8f3f2-6f5e-5a3c-9d2b-6a3e2f1c4d5e";
const TRANSACTION_HASH = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";

function setup() {
  const uiHooks: OperationDetailsUiHooks = { "operationDetails.open": jest.fn() };
  const operationDetailsHandlers = handlers({ uiHooks });
  const answers: string[] = [];
  const transport = {
    onMessage: undefined as ((message: string) => void) | undefined,
    send: (message: string) => answers.push(message),
  };
  const config = {
    appId: "earn",
    userId: "user",
    tracking: false,
    wallet: { name: "test-wallet", version: "1.0.0" },
  } as unknown as ConstructorParameters<typeof WalletAPIServer>[1];
  new WalletAPIServer(transport, config, undefined, operationDetailsHandlers).setPermissions({
    methodIds: Object.keys(operationDetailsHandlers),
  });

  const openOperationDetails = async (params: unknown): Promise<RpcAnswer> => {
    transport.onMessage?.(
      JSON.stringify({ jsonrpc: "2.0", id: "1", method: "custom.openOperationDetails", params }),
    );
    await new Promise(setImmediate);
    return JSON.parse(answers[0]) as RpcAnswer;
  };
  return { uiHooks, openOperationDetails };
}

describe("custom.openOperationDetails", () => {
  it("opens the operation details of the Wallet API account and transaction hash", async () => {
    const { uiHooks, openOperationDetails } = setup();

    const answer = await openOperationDetails({
      accountId: WALLET_ACCOUNT_ID,
      transactionHash: TRANSACTION_HASH,
    });

    expect(answer.error).toBeUndefined();
    expect(uiHooks["operationDetails.open"]).toHaveBeenCalledWith({
      walletAccountId: WALLET_ACCOUNT_ID,
      transactionHash: TRANSACTION_HASH,
    });
  });

  it.each([
    { transactionHash: TRANSACTION_HASH },
    { accountId: WALLET_ACCOUNT_ID },
    { accountId: "", transactionHash: TRANSACTION_HASH },
    { accountId: WALLET_ACCOUNT_ID, transactionHash: 42 },
  ])("answers INVALID_PARAMS without opening anything for %o", async params => {
    const { uiHooks, openOperationDetails } = setup();

    const answer = await openOperationDetails(params);

    expect(answer.error?.code).toBe(-32602);
    expect(uiHooks["operationDetails.open"]).not.toHaveBeenCalled();
  });

  it("keeps the name of the error the app throws in the answer", async () => {
    const { uiHooks, openOperationDetails } = setup();
    jest.mocked(uiHooks["operationDetails.open"]).mockImplementationOnce(() => {
      throw new OperationDetailsOperationNotFound("No operation with the hash");
    });

    const answer = await openOperationDetails({
      accountId: WALLET_ACCOUNT_ID,
      transactionHash: TRANSACTION_HASH,
    });

    expect(answer.error?.data).toMatchObject({
      data: { name: "OperationDetailsOperationNotFound" },
    });
  });
});
