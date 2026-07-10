import { dappSendTransactionLogic } from "../sendTransaction";
import type { DappSendTransactionContext } from "../sendTransaction";

jest.mock("@ledgerhq/coin-evm/utils", () => ({
  safeEncodeEIP55: (addr: string) => addr,
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn(),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn(),
}));

jest.mock("../../../converters", () => ({
  getWalletAPITransactionSignFlowInfos: jest.fn(),
}));

jest.mock("../../../../account/index", () => ({
  getMainAccount: jest.fn((account: unknown) => account),
}));

jest.mock("../../../../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("../../../utils/txTrackingHelper", () => ({
  getTxType: jest.fn().mockReturnValue("transfer"),
}));

jest.mock("../../../utils/ledgerButtonTracking", () => ({
  isLedgerButtonReferrer: jest.fn().mockReturnValue(false),
  reportLedgerButtonBroadcast: jest.fn(),
}));

jest.mock("../../../blindSigningContext", () => ({
  withLiveAppContext: jest.fn((_manifest: unknown, fn: () => unknown) => fn()),
}));

const { getEnv } = jest.requireMock("@ledgerhq/live-env");
const { getCryptoAssetsStore } = jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");
const { getWalletAPITransactionSignFlowInfos } = jest.requireMock("../../../converters");
const { getAccountBridge } = jest.requireMock("../../../../bridge");
const { isLedgerButtonReferrer, reportLedgerButtonBroadcast } = jest.requireMock(
  "../../../utils/ledgerButtonTracking",
);

const ethCurrency = { id: "ethereum", name: "Ethereum" };

const account = {
  type: "Account",
  id: "acc-1",
  freshAddress: "0xFROM",
  currency: ethCurrency,
} as never;

const ethTX = { from: "0xFROM", to: "0xRECIPIENT", value: "0x0" };

const signFlowInfos = {
  canEditFees: true,
  hasFeesProvided: false,
  liveTx: { family: "evm", recipient: "0xRECIPIENT" },
};

function buildContext(
  overrides: Partial<DappSendTransactionContext> = {},
): DappSendTransactionContext {
  const tracking = {
    dappSendTransactionRequested: jest.fn(),
    dappSendTransactionSuccess: jest.fn(),
    dappSendTransactionFail: jest.fn(),
  };
  return {
    manifest: { id: "dapp-1" } as never,
    account,
    chainID: 1,
    tracking: tracking as never,
    ...overrides,
  };
}

function makeSignedOperation(hash: string) {
  return { operation: { hash }, signature: "0xsig" } as never;
}

describe("dappSendTransactionLogic", () => {
  let broadcast: jest.Mock;
  let findTokenByAddressInCurrency: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    broadcast = jest.fn().mockResolvedValue({ hash: "0xbroadcasted" });
    getAccountBridge.mockResolvedValue({ broadcast });
    findTokenByAddressInCurrency = jest.fn().mockResolvedValue(null);
    getCryptoAssetsStore.mockReturnValue({ findTokenByAddressInCurrency });
    getWalletAPITransactionSignFlowInfos.mockResolvedValue(signFlowInfos);
    getEnv.mockReturnValue(false); // broadcast enabled by default
  });

  it("signs, broadcasts and returns the broadcasted operation hash when broadcast is enabled", async () => {
    const context = buildContext();
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));
    const onBroadcasted = jest.fn();

    const hash = await dappSendTransactionLogic(context, ethTX, signTransaction, onBroadcasted);

    expect(hash).toBe("0xbroadcasted");
    expect(signTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ account, parentAccount: undefined, signFlowInfos }),
    );
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        broadcastConfig: expect.objectContaining({
          mevProtected: false,
          source: { type: "dApp", name: "dapp-1" },
        }),
      }),
    );
    expect(onBroadcasted).toHaveBeenCalledWith(account, { hash: "0xbroadcasted" });
    expect(context.tracking.dappSendTransactionRequested).toHaveBeenCalled();
    expect(context.tracking.dappSendTransactionSuccess).toHaveBeenCalled();
  });

  it("skips broadcast and returns the signed operation hash when DISABLE_TRANSACTION_BROADCAST is set", async () => {
    getEnv.mockReturnValue(true);
    const context = buildContext();
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));
    const onBroadcasted = jest.fn();

    const hash = await dappSendTransactionLogic(context, ethTX, signTransaction, onBroadcasted);

    expect(hash).toBe("0xsigned");
    expect(broadcast).not.toHaveBeenCalled();
    expect(onBroadcasted).toHaveBeenCalledWith(account, { hash: "0xsigned" });
  });

  it("forwards mevProtected to the broadcast config", async () => {
    const context = buildContext({ mevProtected: true });
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));

    await dappSendTransactionLogic(context, ethTX, signTransaction, jest.fn());

    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        broadcastConfig: expect.objectContaining({ mevProtected: true }),
      }),
    );
  });

  it("derives tracking currency/network from the token when the account is a token account", async () => {
    const tokenAccount = {
      type: "TokenAccount",
      id: "token-1",
      token: { name: "USDC", parentCurrencyId: "ethereum" },
    } as never;
    const context = buildContext({ account: tokenAccount });
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));

    await dappSendTransactionLogic(context, ethTX, signTransaction, jest.fn());

    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("0xRECIPIENT", "ethereum");
    expect(context.tracking.dappSendTransactionSuccess).toHaveBeenCalledWith(
      context.manifest,
      expect.objectContaining({ currency: "USDC", network: "ethereum" }),
    );
  });

  it("prefers the resolved token metadata for tracking when a token is found at the recipient", async () => {
    findTokenByAddressInCurrency.mockResolvedValue({ name: "DAI", parentCurrencyId: "ethereum" });
    const context = buildContext();
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));

    await dappSendTransactionLogic(context, ethTX, signTransaction, jest.fn());

    expect(context.tracking.dappSendTransactionRequested).toHaveBeenCalledWith(
      context.manifest,
      expect.objectContaining({ currency: "DAI", network: "ethereum" }),
    );
  });

  it("reports the ledger-button broadcast when the referrer is a ledger button", async () => {
    isLedgerButtonReferrer.mockReturnValue(true);
    const context = buildContext({ referrer: "ledger-button" });
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));

    await dappSendTransactionLogic(context, ethTX, signTransaction, jest.fn());

    expect(reportLedgerButtonBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        dappId: "dapp-1",
        chainId: 1,
        transactionHash: "0xbroadcasted",
        referrer: "ledger-button",
      }),
    );
  });

  it("does not report a ledger-button broadcast for a non-ledger referrer", async () => {
    isLedgerButtonReferrer.mockReturnValue(false);
    const context = buildContext({ referrer: "somewhere-else" });
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));

    await dappSendTransactionLogic(context, ethTX, signTransaction, jest.fn());

    expect(reportLedgerButtonBroadcast).not.toHaveBeenCalled();
  });

  it("passes hwAppId/dependencies options when the manifest declares a nanoApp", async () => {
    const context = buildContext({
      manifest: { id: "dapp-1", dapp: { nanoApp: "Ethereum", dependencies: ["Foo"] } } as never,
    });
    const signTransaction = jest.fn().mockResolvedValue(makeSignedOperation("0xsigned"));

    await dappSendTransactionLogic(context, ethTX, signTransaction, jest.fn());

    expect(signTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ options: { hwAppId: "Ethereum", dependencies: ["Foo"] } }),
    );
  });

  it("tracks the failure and rethrows when signing rejects", async () => {
    const context = buildContext();
    const error = new Error("user rejected");
    const signTransaction = jest.fn().mockRejectedValue(error);

    await expect(
      dappSendTransactionLogic(context, ethTX, signTransaction, jest.fn()),
    ).rejects.toThrow("user rejected");
    expect(context.tracking.dappSendTransactionFail).toHaveBeenCalled();
    expect(context.tracking.dappSendTransactionSuccess).not.toHaveBeenCalled();
  });
});
