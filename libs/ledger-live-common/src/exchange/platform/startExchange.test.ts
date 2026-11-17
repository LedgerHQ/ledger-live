import { createExchange } from "@ledgerhq/hw-app-exchange";
import type Transport from "@ledgerhq/hw-transport";
import { getProviderConfig, getSwapProvider } from "../providers";
import { startNewExchangeTransaction } from "./startExchange";

// `ExchangeTypes` is a const enum: tsc inlines it, but jest has to be given its values.
jest.mock("@ledgerhq/hw-app-exchange", () => ({
  ...jest.requireActual("@ledgerhq/hw-app-exchange"),
  createExchange: jest.fn(),
  ExchangeTypes: { Swap: 0, Sell: 1, Fund: 2, SwapNg: 3, SellNg: 4, FundNg: 5 },
}));
jest.mock("../providers", () => ({
  getSwapProvider: jest.fn(),
  getProviderConfig: jest.fn(),
}));
jest.mock("../../hw/deviceAccess", () => ({ withDevice: jest.fn() }));

const SWAP = 0;
const SELL = 1;
const SWAP_NG = 3;

const transport = { id: "transport" } as unknown as Transport;
const startNewTransaction = jest.fn();

describe("startNewExchangeTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startNewTransaction.mockResolvedValue("nonce-1");
    jest.mocked(createExchange).mockReturnValue({ startNewTransaction } as never);
  });

  it("starts a swap with the version of its provider and resolves with the nonce", async () => {
    jest.mocked(getSwapProvider).mockResolvedValue({ version: 2 } as never);

    await expect(
      startNewExchangeTransaction(transport, { exchangeType: SWAP, provider: "changelly" }),
    ).resolves.toBe("nonce-1");

    expect(getSwapProvider).toHaveBeenCalledWith("changelly");
    expect(createExchange).toHaveBeenCalledWith(transport, SWAP, undefined, 2);
  });

  it("looks the version of a sell or fund provider up on its exchange type", async () => {
    jest.mocked(getProviderConfig).mockResolvedValue({ version: 3 } as never);

    await startNewExchangeTransaction(transport, { exchangeType: SELL, provider: "coinify" });

    expect(getProviderConfig).toHaveBeenCalledWith(SELL, "coinify");
    expect(createExchange).toHaveBeenCalledWith(transport, SELL, undefined, 3);
  });

  it("starts without a version when no provider is given", async () => {
    await startNewExchangeTransaction(transport, { exchangeType: SWAP });

    expect(getSwapProvider).not.toHaveBeenCalled();
    expect(createExchange).toHaveBeenCalledWith(transport, SWAP, undefined, undefined);
  });

  it("refuses a swap provider the Exchange app does not handle", async () => {
    jest
      .mocked(getSwapProvider)
      .mockResolvedValue({ useInExchangeApp: false, type: "DEX", version: 1 } as never);

    await expect(
      startNewExchangeTransaction(transport, { exchangeType: SWAP, provider: "lifi" }),
    ).rejects.toThrow("Unsupported provider type DEX");
    expect(startNewTransaction).not.toHaveBeenCalled();
  });

  it("refuses an NG exchange type the installed Exchange app is too old for", async () => {
    await expect(
      startNewExchangeTransaction(transport, { exchangeType: SWAP_NG, appVersion: "3.2.0" }),
    ).rejects.toThrow("Incompatible AppExchange version with NG command");
    expect(startNewTransaction).not.toHaveBeenCalled();
  });

  it("allows an NG exchange type from the first Exchange app version that supports it", async () => {
    await expect(
      startNewExchangeTransaction(transport, { exchangeType: SWAP_NG, appVersion: "3.3.0" }),
    ).resolves.toBe("nonce-1");
  });

  it("does not touch the device once cancelled", async () => {
    await expect(
      startNewExchangeTransaction(transport, { exchangeType: SWAP }, () => true),
    ).resolves.toBeUndefined();
    expect(createExchange).not.toHaveBeenCalled();
  });

  it("does not touch the device when cancelled during the provider lookup", async () => {
    let cancelled = false;
    jest.mocked(getSwapProvider).mockImplementation(async () => {
      cancelled = true;
      return { version: 2 } as never;
    });

    await expect(
      startNewExchangeTransaction(
        transport,
        { exchangeType: SWAP, provider: "changelly" },
        () => cancelled,
      ),
    ).resolves.toBeUndefined();
    expect(createExchange).not.toHaveBeenCalled();
    expect(startNewTransaction).not.toHaveBeenCalled();
  });
});
