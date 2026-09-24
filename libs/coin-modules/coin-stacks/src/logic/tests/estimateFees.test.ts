import type {
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  estimateTransactionByteLength,
  fetchFeeEstimateTransaction,
  serializePayload,
} from "@stacks/transactions";
import { getStacksBaseUrl } from "../../network/api";
import type { StacksTxData } from "../../types";
import { getNextSequence } from "../getNextSequence";
import { buildUnsignedTx } from "../buildUnsignedTx";
import { estimateFees } from "../estimateFees";
import { mockStacksConfig } from "../../test/context";

jest.mock("../getNextSequence");
jest.mock("../buildUnsignedTx", () => ({
  buildUnsignedTx: jest.fn(),
}));
jest.mock("@stacks/transactions", () => ({
  estimateTransactionByteLength: jest.fn(),
  fetchFeeEstimateTransaction: jest.fn(),
  serializePayload: jest.fn(),
}));
jest.mock("../../network/api", () => ({ getStacksBaseUrl: jest.fn() }));

const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

const intent: TransactionIntent<MemoNotSupported, StacksTxData> = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA",
  amount: 1000n,
  asset: { type: "native" },
  data: { type: "stacks-pox" },
};

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getNextSequence as jest.Mock).mockResolvedValue(5n);
    (buildUnsignedTx as jest.Mock).mockResolvedValue({ payload: {} });
    (serializePayload as jest.Mock).mockReturnValue("0xpayload");
    (estimateTransactionByteLength as jest.Mock).mockReturnValue(180);
    (getStacksBaseUrl as jest.Mock).mockReturnValue("https://stacks.test.invalid");
  });

  it("throws a clear error when the API base URL is unset", async () => {
    (getStacksBaseUrl as jest.Mock).mockImplementation(() => {
      throw new Error("API base URL not available");
    });

    await expect(estimateFees(mockStacksConfig, intent)).rejects.toThrow(
      "API base URL not available",
    );
  });

  it("builds a zero-fee tx to size it, then returns the low-tier estimate", async () => {
    (fetchFeeEstimateTransaction as jest.Mock).mockResolvedValue([
      { fee: 100, fee_rate: 1 },
      { fee: 250, fee_rate: 2 },
      { fee: 500, fee_rate: 4 },
    ]);

    const result = await estimateFees(mockStacksConfig, intent);

    expect(buildUnsignedTx).toHaveBeenCalledWith(mockStacksConfig, intent, 0n, 5n);
    expect(fetchFeeEstimateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ payload: "0xpayload", estimatedLength: 180, network: "mainnet" }),
    );
    expect(result).toEqual({ value: 100n });
  });

  it("uses the intent's own sequence when provided", async () => {
    (fetchFeeEstimateTransaction as jest.Mock).mockResolvedValue([
      { fee: 100 },
      { fee: 250 },
      { fee: 500 },
    ]);

    await estimateFees(mockStacksConfig, { ...intent, sequence: 99n });

    expect(getNextSequence).not.toHaveBeenCalled();
    expect(buildUnsignedTx).toHaveBeenCalledWith(mockStacksConfig, expect.anything(), 0n, 99n);
  });
});
