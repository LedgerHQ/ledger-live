/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions
import { act, renderHook } from "@testing-library/react";
import { setEnv } from "@ledgerhq/live-env";
import { getAccountBridge } from "../bridge/index";
import { useBroadcast } from "./useBroadcast";

jest.mock("../bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("../promise", () => ({
  execAndWaitAtLeast: <A>(_ms: number, cb: () => Promise<A>) => cb(),
}));

describe("useBroadcast", () => {
  const mockBroadcast = jest.fn();
  jest.mocked(getAccountBridge).mockReturnValue({
    broadcast: mockBroadcast,
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not broadcast when 'DISABLE_TRANSACTION_BROADCAST' is true", async () => {
    setEnv("DISABLE_TRANSACTION_BROADCAST", true);

    const { result } = renderHook(() => useBroadcast({ account: {}, parentAccount: {} } as any));

    let value: unknown;
    await act(async () => {
      value = await result.current({ operation: { id: "operation-id" } } as any);
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
    const transaction = { useAllAmount: true } as any;

    it("logs on success", async () => {
      const logger = jest.fn();
      mockBroadcast.mockResolvedValue({ id: "operation-id", date: new Date(2026, 3, 24) });

      setEnv("LEDGER_CLIENT_VERSION", "llc/test");
      setEnv("DISABLE_TRANSACTION_BROADCAST", false);

      const { result } = renderHook(() =>
        useBroadcast({
          account,
          parentAccount,
          transaction,
          broadcastConfig: { source: { type: "coin-module", name: "ledger-live-desktop" } },
          logger,
        } as any),
      );

      let value: unknown;
      await act(async () => {
        value = await result.current({} as any);
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
          account,
          parentAccount,
          transaction,
          broadcastConfig: { source: { type: "coin-module", name: "ledger-live-desktop" } },
          logger,
        } as any),
      );

      await act(async () => {
        await expect(
          result.current({
            signature: "signed-transaction",
            rawData: { raw_hex: "raw-hex" },
          } as any),
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
        account,
        parentAccount: account,
        logger,
      } as any),
    );

    await act(async () => {
      await result.current({} as any);
    });

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({ currencyId: "ethereum_sepolia", isTestnet: true }),
    );
  });
});
