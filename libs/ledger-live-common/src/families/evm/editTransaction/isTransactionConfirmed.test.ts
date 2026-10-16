import { getNodeApi } from "@ledgerhq/coin-evm/network";
import type { NodeApi } from "@ledgerhq/coin-evm/network";
import type { Account } from "@ledgerhq/types-live";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { chainReadsFor } from "../../../bridge/generic-coin-framework/chainReads";
import { isTransactionConfirmed } from "./isTransactionConfirmed";

jest.mock("@ledgerhq/coin-evm/network", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/network"),
  getNodeApi: jest.fn(),
}));
jest.mock("../../../bridge/generic-coin-framework/chainReads", () => ({
  chainReadsFor: jest.fn(),
}));

function mockNodeApi(overrides: Partial<jest.Mocked<NodeApi>> = {}): jest.Mocked<NodeApi> {
  return {
    getTransaction: jest.fn(),
    getCoinBalance: jest.fn(),
    getTokenBalance: jest.fn(),
    getTokenAllowance: jest.fn(),
    getTransactionCount: jest.fn(),
    getGasEstimation: jest.fn(),
    getFeeData: jest.fn(),
    broadcastTransaction: jest.fn(),
    getBlockByHeight: jest.fn(),
    getBlockReceipts: jest.fn(),
    getOptimismAdditionalFees: jest.fn(),
    getScrollAdditionalFees: jest.fn(),
    ...overrides,
  } as jest.Mocked<NodeApi>;
}

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("isTransactionConfirmed", () => {
  const nodeApiMock = mockNodeApi();

  beforeAll(() => {
    LiveConfig.setConfig({
      config_currency_external_coin: { type: "object", default: {} },
    } as never);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockReturnValue(nodeApiMock);
  });

  test("should return true if blockHeight is not null", async () => {
    const account = { type: "Account", currency: { id: "external_coin" } } as Account;
    const hash = "transactionHash";
    const blockHeight = 12345;

    nodeApiMock.getTransaction.mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ account, hash });

    expect(result).toBe(true);
    expect(nodeApiMock.getTransaction).toHaveBeenCalledWith(hash);
  });

  test("should return false if blockHeight is null", async () => {
    const account = { type: "Account", currency: { id: "external_coin" } } as Account;
    const hash = "transactionHash";
    const blockHeight = null;

    nodeApiMock.getTransaction.mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ account, hash });

    expect(result).toBe(false);
    expect(nodeApiMock.getTransaction).toHaveBeenCalledWith(hash);
  });

  test("should return false when the node gives no block height", async () => {
    const account = { type: "Account", currency: { id: "external_coin" } } as Account;
    nodeApiMock.getTransaction.mockResolvedValue({} as any);

    await expect(isTransactionConfirmed({ account, hash: "transactionHash" })).resolves.toBe(false);
  });

  test("should propagate a failure that is no error object", async () => {
    const account = { type: "Account", currency: { id: "external_coin" } } as Account;
    nodeApiMock.getTransaction.mockRejectedValue(null);

    await expect(isTransactionConfirmed({ account, hash: "transactionHash" })).rejects.toBeNull();
  });

  test("should return false for a token account", async () => {
    const account = { type: "TokenAccount" } as never;

    await expect(isTransactionConfirmed({ account, hash: "transactionHash" })).resolves.toBe(false);
    expect(nodeApiMock.getTransaction).not.toHaveBeenCalled();
  });

  test("should return false while the explorer does not index the hash yet", async () => {
    const account = { type: "Account", currency: { id: "external_coin" } } as Account;
    nodeApiMock.getTransaction.mockRejectedValue({ name: "LedgerAPI4xx", status: 404 });

    await expect(isTransactionConfirmed({ account, hash: "transactionHash" })).resolves.toBe(false);
  });

  test("should propagate any other failure", async () => {
    const account = { type: "Account", currency: { id: "external_coin" } } as Account;
    const failure = { name: "LedgerAPI5xx", status: 500 };
    nodeApiMock.getTransaction.mockRejectedValue(failure);

    await expect(isTransactionConfirmed({ account, hash: "transactionHash" })).rejects.toBe(
      failure,
    );
  });
});

describe("isTransactionConfirmed through the portfolio layer", () => {
  const getTransactionInfo = jest.fn();
  const account = {
    type: "Account",
    currency: { id: "portfolio_coin" },
    operations: [
      { hash: "mined", blockHeight: 12 },
      { hash: "pending", blockHeight: null },
    ],
  } as unknown as Account;

  beforeAll(() => {
    LiveConfig.setConfig({
      config_currency_portfolio_coin: { type: "object", default: { portfolio: { enabled: true } } },
    } as never);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(chainReadsFor).mockResolvedValue({ getTransactionInfo } as never);
  });

  test("reads whether the network knows the transaction in a block", async () => {
    getTransactionInfo
      .mockResolvedValueOnce({ hash: "a", block: { height: 3, hash: "b", time: new Date() } })
      .mockResolvedValueOnce({ hash: "a", block: null })
      .mockResolvedValueOnce(undefined);

    await expect(isTransactionConfirmed({ account, hash: "a" })).resolves.toBe(true);
    await expect(isTransactionConfirmed({ account, hash: "a" })).resolves.toBe(false);
    await expect(isTransactionConfirmed({ account, hash: "a" })).resolves.toBe(false);
    expect(chainReadsFor).toHaveBeenCalledWith(account.currency);
    expect(getTransactionInfo).toHaveBeenCalledWith("a");
    expect(mockGetNodeApi).not.toHaveBeenCalled();
  });

  test("answers from the synced operations when the portfolio looks no transaction up", async () => {
    getTransactionInfo.mockRejectedValue(new ChainReadUnsupportedError("not served"));

    await expect(isTransactionConfirmed({ account, hash: "mined" })).resolves.toBe(true);
    await expect(isTransactionConfirmed({ account, hash: "pending" })).resolves.toBe(false);
    await expect(isTransactionConfirmed({ account, hash: "unknown" })).resolves.toBe(false);
  });

  test("propagates any other failure", async () => {
    const failure = new Error("node down");
    getTransactionInfo.mockRejectedValue(failure);

    await expect(isTransactionConfirmed({ account, hash: "mined" })).rejects.toBe(failure);
  });
});
