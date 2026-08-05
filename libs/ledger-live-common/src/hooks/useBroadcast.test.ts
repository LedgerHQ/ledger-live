/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions
import { act, renderHook } from "@testing-library/react";
import { setEnv } from "@shared/env";
import { getAccountBridge } from "../bridge/index";
import { useBroadcast } from "./useBroadcast";
import type {
  Account,
  AccountLike,
  BroadcastConfig,
  ResolvedAccountBridge,
  SignedOperation,
  TransactionCommon,
} from "@ledgerhq/types-live";

jest.mock("../bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("../promise", () => ({
  execAndWaitAtLeast: <A>(_ms: number, cb: () => Promise<A>) => cb(),
}));

const defaultSignedOperation = { operation: { type: "OUT" } } as unknown as SignedOperation;

describe("useBroadcast", () => {
  const mockBroadcast = jest.fn();
  jest.mocked(getAccountBridge).mockResolvedValue({
    broadcast: mockBroadcast,
  } as unknown as ResolvedAccountBridge<any>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not broadcast when 'DISABLE_TRANSACTION_BROADCAST' is true", async () => {
    setEnv("DISABLE_TRANSACTION_BROADCAST", true);

    const { result } = renderHook(() =>
      useBroadcast({
        account: {} as unknown as AccountLike,
        parentAccount: {} as unknown as Account,
      }),
    );

    let value: unknown;
    await act(async () => {
      value = await result.current({
        operation: { id: "operation-id" },
      } as unknown as SignedOperation);
    });

    expect(mockBroadcast).not.toHaveBeenCalled();
    expect(value).toEqual({ id: "operation-id" });
  });

  describe.each([
    [
      "when sending native asset",
      { id: "main-account-id", type: "Account", currency: { id: "currency-id", family: "family" } },
      { id: "main-account-id", type: "Account", currency: { id: "currency-id", family: "family" } },
      undefined,
    ],
    [
      "when sending token asset",
      { id: "sub-account-id", type: "TokenAccount", token: { id: "token-id" } },
      { id: "main-account-id", type: "Account", currency: { id: "currency-id", family: "family" } },
      "token-id",
    ],
  ])("%s", (_s, account, parentAccount, expectedTokenId) => {
    const transaction = { useAllAmount: true } as unknown as TransactionCommon;

    it("logs on success", async () => {
      const logger = jest.fn();
      mockBroadcast.mockResolvedValue({ id: "operation-id", date: new Date(2026, 3, 24) });

      setEnv("LEDGER_CLIENT_VERSION", "llc/test");
      setEnv("DISABLE_TRANSACTION_BROADCAST", false);

      const { result } = renderHook(() =>
        useBroadcast({
          account: account as unknown as AccountLike,
          parentAccount: parentAccount as unknown as Account,
          transaction: transaction as unknown as TransactionCommon,
          broadcastConfig: {
            source: { type: "coin-module", name: "ledger-live-desktop" },
          } as unknown as BroadcastConfig,
          logger,
        }),
      );

      let value: unknown;
      await act(async () => {
        value = await result.current(defaultSignedOperation);
      });

      expect(logger).toHaveBeenCalledWith({
        status: "success",
        currencyId: "currency-id",
        tokenId: expectedTokenId,
        family: "family",
        appVersion: "llc/test",
        isTestnet: false,
        isSendMax: true,
        source: { type: "coin-module", name: "ledger-live-desktop" },
        intentType: "OUT",
      });
      expect(value).toEqual({ id: "operation-id", date: new Date(2026, 3, 24) });
    });

    it("logs on error", async () => {
      const logger = jest.fn();
      mockBroadcast.mockRejectedValue(new Error("Broadcast failed"));

      setEnv("LEDGER_CLIENT_VERSION", "llc/test");
      setEnv("DISABLE_TRANSACTION_BROADCAST", false);

      const { result } = renderHook(() =>
        useBroadcast({
          account: account as unknown as AccountLike,
          parentAccount: parentAccount as unknown as Account,
          transaction: transaction as unknown as TransactionCommon,
          broadcastConfig: {
            source: { type: "coin-module", name: "ledger-live-desktop" },
          } as unknown as BroadcastConfig,
          logger,
        }),
      );

      await act(async () => {
        await expect(
          result.current({
            signature: "signed-transaction",
            rawData: { raw_hex: "raw-hex" },
            operation: { type: "OUT" },
          } as unknown as SignedOperation),
        ).rejects.toThrow(new Error("Broadcast failed"));
      });

      expect(logger).toHaveBeenCalledWith({
        status: "failure",
        error: new Error("Broadcast failed"),
        currencyId: "currency-id",
        tokenId: expectedTokenId,
        family: "family",
        appVersion: "llc/test",
        isTestnet: false,
        isSendMax: true,
        source: { type: "coin-module", name: "ledger-live-desktop" },
        txPayload: { signature: "signed-transaction", rawData: { raw_hex: "raw-hex" } },
        intentType: "OUT",
      });
    });
  });

  it("derives isTestnet from the currency model (true for a testnet currency)", async () => {
    const logger = jest.fn();
    mockBroadcast.mockResolvedValue({ id: "operation-id", date: new Date(2026, 3, 24) });
    setEnv("LEDGER_CLIENT_VERSION", "llc/test");
    setEnv("DISABLE_TRANSACTION_BROADCAST", false);

    const account = {
      id: "main-account-id",
      type: "Account",
      currency: { id: "ethereum_sepolia", family: "evm", isTestnetFor: "ethereum" },
    };

    const { result } = renderHook(() =>
      useBroadcast({
        account: account as unknown as AccountLike,
        parentAccount: account as unknown as Account,
        logger,
      }),
    );

    await act(async () => {
      await result.current(defaultSignedOperation);
    });

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({ currencyId: "ethereum_sepolia", isTestnet: true }),
    );
  });

  it("should log mode as intentType when available in transaction", async () => {
    const logger = jest.fn();
    mockBroadcast.mockResolvedValue({ id: "operation-id", date: new Date(2026, 3, 24) });
    setEnv("LEDGER_CLIENT_VERSION", "llc/test");
    setEnv("DISABLE_TRANSACTION_BROADCAST", false);

    const account = {
      id: "main-account-id",
      type: "Account",
      currency: { id: "ethereum_sepolia", family: "evm", isTestnetFor: "ethereum" },
    } as unknown as AccountLike;

    const { result } = renderHook(() =>
      useBroadcast({
        account,
        parentAccount: account as unknown as Account,
        logger,
        transaction: { mode: "send" } as unknown as TransactionCommon,
      }),
    );

    await act(async () => {
      await result.current({ operation: { type: "IN" } } as unknown as SignedOperation);
    });

    expect(logger).toHaveBeenCalledWith(expect.objectContaining({ intentType: "send" }));
  });

  it("should log type from operation as intentType when mode is not available in transaction", async () => {
    const logger = jest.fn();
    mockBroadcast.mockResolvedValue({ id: "operation-id", date: new Date(2026, 3, 24) });
    setEnv("LEDGER_CLIENT_VERSION", "llc/test");
    setEnv("DISABLE_TRANSACTION_BROADCAST", false);

    const account = {
      id: "main-account-id",
      type: "Account",
      currency: { id: "ethereum_sepolia", family: "evm", isTestnetFor: "ethereum" },
    } as unknown as AccountLike;

    const { result } = renderHook(() =>
      useBroadcast({
        account,
        parentAccount: account as unknown as Account,
        logger,
        transaction: {} as unknown as TransactionCommon,
      }),
    );

    await act(async () => {
      await result.current(defaultSignedOperation);
    });

    expect(logger).toHaveBeenCalledWith(expect.objectContaining({ intentType: "OUT" }));
  });
});
