import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { type TronCoinConfig, type TronContext } from "../config";
import type { TronMemo, TronTxData } from "../types";
import { STANDARD_FEE_OPTION_ID, TRONIFY_FEE_OPTION_ID } from "./constants";
import { estimateFees } from "./estimateFees";
import { listFeeOptions } from "./feeOptions";

jest.mock("./estimateFees", () => ({ estimateFees: jest.fn() }));

const mockEstimateFees = jest.mocked(estimateFees);

const TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const SENDER = "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3";
const RECIPIENT = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";

const activatedConfig = {
  explorer: { url: "https://explorer" },
  status: { type: "active" },
  energyRent: {
    provider: "tronify",
    tronify: { url: "https://open.tronify.io", sourceFlag: "ledger" },
  },
} as unknown as TronCoinConfig;

const notActivatedConfig = {
  explorer: { url: "https://explorer" },
  status: { type: "active" },
} as unknown as TronCoinConfig;

const mockLogger: Logger = jest.fn();
// One mockConfig seed covers both consumers — listFeeOptions resolves config once and threads it
// into estimateFees and getEnergyProvider.
const mockConfig = jest.fn<Promise<TronCoinConfig>, []>();
const mockContext = { logger: mockLogger, config: mockConfig } as unknown as TronContext;

const malformedProviderConfig = {
  explorer: { url: "https://explorer" },
  status: { type: "active" },
  energyRent: { provider: "tronify", tronify: {} },
} as unknown as TronCoinConfig;

const sendTrc20 = (recipient = RECIPIENT): TransactionIntent<TronMemo, TronTxData> => ({
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient,
  amount: BigInt(1000),
  asset: { type: "trc20", assetReference: TRC20_CONTRACT },
  data: { type: "tron" },
});

const sendNative: TransactionIntent<TronMemo, TronTxData> = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "native" },
  data: { type: "tron" },
};

const sendTrc10: TransactionIntent<TronMemo, TronTxData> = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "trc10", assetReference: "1002000" },
  data: { type: "tron" },
};

// The Tronify offer is gated on an ENERGY shortfall (energyRequired > energyAvailable), so every
// estimate carries a resource breakdown. Default to a shortfall so the activated cases offer Tronify;
// pass equal/greater available energy to model a sender who needs no rental.
const fee = (
  value: bigint,
  energy: { required: string; available: string } = { required: "10000", available: "0" },
): FeeEstimation => ({
  value,
  parameters: { energyRequired: energy.required, energyAvailable: energy.available },
});

const standardOption = {
  id: STANDARD_FEE_OPTION_ID,
  feeAsset: expect.objectContaining({ type: "native" }),
};
const tronifyOption = {
  id: TRONIFY_FEE_OPTION_ID,
  feeAsset: expect.objectContaining({ type: "native" }),
};

describe("listFeeOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.mockResolvedValue(activatedConfig);
    mockEstimateFees.mockResolvedValue(fee(1_000_000n));
  });

  it("returns [standard] for a native TRX transfer (Tronify does not apply)", async () => {
    await expect(listFeeOptions(mockContext, sendNative)).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] for a TRC-10 transfer (Tronify does not apply)", async () => {
    await expect(listFeeOptions(mockContext, sendTrc10)).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] before a recipient is entered, without estimating", async () => {
    await expect(listFeeOptions(mockContext, sendTrc20(""))).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] for a malformed recipient, without estimating (no log spam while typing)", async () => {
    await expect(listFeeOptions(mockContext, sendTrc20("TJRabPrwbZy45sbav"))).resolves.toEqual([
      standardOption,
    ]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] when Tronify is not activated in coin-config", async () => {
    mockConfig.mockResolvedValue(notActivatedConfig);
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] when the Tronify provider is present but under-configured", async () => {
    mockConfig.mockResolvedValue(malformedProviderConfig);
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] when the sender covers the transfer for free (standard fee is 0)", async () => {
    mockEstimateFees.mockResolvedValue(fee(0n, { required: "0", available: "5000" }));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).toHaveBeenCalledWith(mockLogger, activatedConfig, sendTrc20());
  });

  it("returns [standard] when the sender already has enough energy, even if a bandwidth/activation fee remains", async () => {
    // A nonzero fee that is NOT an energy shortfall (bandwidth/activation only): renting energy would
    // not help, and the account already clears the absolute delivery threshold — so Tronify is not offered.
    mockEstimateFees.mockResolvedValue(fee(1_000_000n, { required: "5000", available: "5000" }));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
  });

  it("returns [tronify, standard] for an activated, energy-deficient TRC-20 transfer", async () => {
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([
      tronifyOption,
      standardOption,
    ]);
  });

  it("reports the fee asset as native TRX for every option", async () => {
    const options = await listFeeOptions(mockContext, sendTrc20());
    expect(options).toEqual([
      {
        id: TRONIFY_FEE_OPTION_ID,
        feeAsset: { type: "native", name: "Tron", unit: expect.objectContaining({ code: "TRX" }) },
      },
      {
        id: STANDARD_FEE_OPTION_ID,
        feeAsset: { type: "native", name: "Tron", unit: expect.objectContaining({ code: "TRX" }) },
      },
    ]);
  });

  it("degrades to [standard] (never throws) when the standard estimate fails", async () => {
    mockEstimateFees.mockRejectedValue(new Error("network down"));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
  });

  it("degrades to [standard] (never throws) when the coin-config read throws", async () => {
    mockConfig.mockRejectedValue(new Error("no coin-config set"));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });
});
