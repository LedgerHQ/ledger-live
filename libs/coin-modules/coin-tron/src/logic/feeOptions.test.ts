import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import coinConfig, { type TronCoinConfig } from "../config";
import type { TronMemo, TronTxData } from "../types";
import { STANDARD_FEE_OPTION_ID, TRONIFY_FEE_OPTION_ID } from "./constants";
import { estimateFees } from "./estimateFees";
import { listFeeOptions } from "./feeOptions";

jest.mock("./estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../config", () => ({ __esModule: true, default: { getCoinConfig: jest.fn() } }));

const mockEstimateFees = jest.mocked(estimateFees);
const mockGetCoinConfig = jest.mocked(coinConfig.getCoinConfig);

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

const standardOption = { id: STANDARD_FEE_OPTION_ID, feeAsset: expect.objectContaining({ type: "native" }) };
const tronifyOption = { id: TRONIFY_FEE_OPTION_ID, feeAsset: expect.objectContaining({ type: "native" }) };

describe("listFeeOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue(activatedConfig);
    mockEstimateFees.mockResolvedValue(fee(1_000_000n));
  });

  it("returns [standard] for a native TRX transfer (Tronify does not apply)", async () => {
    await expect(listFeeOptions(sendNative)).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] for a TRC-10 transfer (Tronify does not apply)", async () => {
    await expect(listFeeOptions(sendTrc10)).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] before a recipient is entered, without estimating", async () => {
    await expect(listFeeOptions(sendTrc20(""))).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] when Tronify is not activated in coin-config", async () => {
    mockGetCoinConfig.mockReturnValue(notActivatedConfig);
    await expect(listFeeOptions(sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("returns [standard] when the sender has enough energy/bandwidth (standard fee is 0)", async () => {
    mockEstimateFees.mockResolvedValue(fee(0n));
    await expect(listFeeOptions(sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).toHaveBeenCalledWith(activatedConfig, sendTrc20());
  });

  it("returns [tronify, standard] for an activated, energy-deficient TRC-20 transfer", async () => {
    await expect(listFeeOptions(sendTrc20())).resolves.toEqual([tronifyOption, standardOption]);
  });

  it("reports the fee asset as native TRX for every option", async () => {
    const options = await listFeeOptions(sendTrc20());
    expect(options).toEqual([
      { id: TRONIFY_FEE_OPTION_ID, feeAsset: { type: "native", name: "Tron", unit: expect.objectContaining({ code: "TRX" }) } },
      { id: STANDARD_FEE_OPTION_ID, feeAsset: { type: "native", name: "Tron", unit: expect.objectContaining({ code: "TRX" }) } },
    ]);
  });

  it("degrades to [standard] (never throws) when the standard estimate fails", async () => {
    mockEstimateFees.mockRejectedValue(new Error("network down"));
    await expect(listFeeOptions(sendTrc20())).resolves.toEqual([standardOption]);
  });

  it("degrades to [standard] (never throws) when the coin-config read throws", async () => {
    mockGetCoinConfig.mockImplementation(() => {
      throw new Error("no coin-config set");
    });
    await expect(listFeeOptions(sendTrc20())).resolves.toEqual([standardOption]);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });
});
