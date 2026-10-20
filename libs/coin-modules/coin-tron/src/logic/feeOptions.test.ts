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

const TRONIFY_SETTINGS = {
  url: "https://open.tronify.io",
  sourceFlag: "ledger",
  paymentAddresses: ["TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx"],
};

const activatedConfig = {
  explorer: { url: "https://explorer" },
  status: { type: "active" },
  energyRent: { provider: "tronify", tronify: TRONIFY_SETTINGS },
} as unknown as TronCoinConfig;

const notActivatedConfig = {
  explorer: { url: "https://explorer" },
  status: { type: "active" },
} as unknown as TronCoinConfig;

const mockLogger: Logger = jest.fn();
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

// Defaults to an energy shortfall (offers Tronify); pass equal/greater available energy for a sender who needs no rental.
const fee = (
  value: bigint,
  energy: { required: string; available: string } = { required: "10000", available: "0" },
  energyEstimated = true,
): FeeEstimation => ({
  value,
  parameters: {
    energyRequired: energy.required,
    energyAvailable: energy.available,
    energyEstimated,
  },
});

const standardOption = {
  id: STANDARD_FEE_OPTION_ID,
  feeAsset: expect.objectContaining({ type: "native" }),
};
const tronifyOption = {
  id: TRONIFY_FEE_OPTION_ID,
  feeAsset: expect.objectContaining({ type: "trc20", assetReference: TRC20_CONTRACT }),
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
    expect(mockLogger).not.toHaveBeenCalled();
  });

  it("returns [standard] and logs when the Tronify provider block is malformed (no url)", async () => {
    mockConfig.mockResolvedValue(malformedProviderConfig);
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
    expect(mockLogger).toHaveBeenCalledWith(
      "tron/listFeeOptions",
      expect.any(String),
      expect.anything(),
    );
  });

  it.each([
    ["missing", undefined],
    ["empty", []],
    ["not a list", "TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx"],
    ["holding an invalid address", ["TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx", "TDii6vao7xyWg2rKPbCP"]],
    ["holding a non-string", ["TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx", 42]],
  ])(
    "returns [standard] and logs, without estimating, when the payment addresses are %s",
    async (_label, paymentAddresses) => {
      mockConfig.mockResolvedValue({
        ...activatedConfig,
        energyRent: { provider: "tronify", tronify: { ...TRONIFY_SETTINGS, paymentAddresses } },
      } as unknown as TronCoinConfig);
      await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
      expect(mockEstimateFees).not.toHaveBeenCalled();
      expect(mockLogger).toHaveBeenCalledWith(
        "tron/listFeeOptions",
        expect.any(String),
        expect.anything(),
      );
    },
  );

  it.each([
    ["missing", { url: "https://tronify.api.live.ledger.com" }],
    ["blank", { url: "https://tronify.api.live.ledger.com", sourceFlag: "  " }],
  ])(
    "returns [standard] without estimating or logging while the sourceFlag is %s",
    async (_label, tronify) => {
      mockConfig.mockResolvedValue({
        ...activatedConfig,
        energyRent: { provider: "tronify", tronify },
      } as unknown as TronCoinConfig);
      await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
      expect(mockEstimateFees).not.toHaveBeenCalled();
      expect(mockLogger).not.toHaveBeenCalled();
    },
  );

  it("returns [standard] for a non-USDT TRC-20 transfer, without estimating", async () => {
    const otherToken: TransactionIntent<TronMemo, TronTxData> = {
      ...sendTrc20(),
      asset: { type: "trc20", assetReference: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8" },
    };
    await expect(listFeeOptions(mockContext, otherToken)).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] when the sender covers the transfer for free (standard fee is 0)", async () => {
    mockEstimateFees.mockResolvedValue(fee(0n, { required: "0", available: "5000" }));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).toHaveBeenCalledWith(mockLogger, activatedConfig, sendTrc20());
  });

  it("returns [standard] when the sender already has enough energy, even if a bandwidth/activation fee remains", async () => {
    mockEstimateFees.mockResolvedValue(fee(1_000_000n, { required: "5000", available: "5000" }));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
  });

  it("returns [tronify, standard] for an activated, energy-deficient TRC-20 transfer", async () => {
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([
      tronifyOption,
      standardOption,
    ]);
  });

  it("returns [standard] when the energy simulation failed (shortfall is a sentinel)", async () => {
    mockEstimateFees.mockResolvedValue(fee(1_000_000n, { required: "1", available: "0" }, false));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
  });

  it("reports USDT as the Tronify fee asset and native TRX as the standard one", async () => {
    const options = await listFeeOptions(mockContext, sendTrc20());
    expect(options).toEqual([
      {
        id: TRONIFY_FEE_OPTION_ID,
        feeAsset: {
          type: "trc20",
          assetReference: TRC20_CONTRACT,
          name: "Tether USD",
          unit: { name: "USDT", code: "USDT", magnitude: 6 },
        },
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
