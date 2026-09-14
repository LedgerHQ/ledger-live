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
const mockConfig = jest.fn<Promise<TronCoinConfig>, []>();
const mockContext = { logger: mockLogger, config: mockConfig } as unknown as TronContext;

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

const fee = (value: bigint): FeeEstimation => ({ value });

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

  it("returns [standard] when the sender has enough energy/bandwidth (standard fee is 0)", async () => {
    mockEstimateFees.mockResolvedValue(fee(0n));
    await expect(listFeeOptions(mockContext, sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).toHaveBeenCalledWith(mockLogger, activatedConfig, sendTrc20());
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
