import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { MemoNotSupported, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { getNodeApi } from "../network/node";
import { EvmAsset, FeeData, Transaction } from "../types";
import { estimateFees } from "./estimateFees";

jest.mock("../network/node", () => ({ getNodeApi: jest.fn() }));

describe("estimateFees", () => {
  const mockCurrency = {
    id: "ethereum",
    family: "evm",
    ethereumLikeInfo: { chainId: 1 },
  } as CryptoCurrency;
  const mockNativeAsset: EvmAsset = { type: "native" };
  const mockTokenAsset: EvmAsset = { type: "token", standard: "erc", contractAddress: "0x1234" };
  const mockIntent: TransactionIntent<EvmAsset, MemoNotSupported> = {
    type: "intent",
    amount: BigInt("1000000000000000000"),
    asset: mockNativeAsset,
    recipient: "0xrecipient",
    sender: "0xsender",
  };

  const mockGasLimit = new BigNumber("21000");
  const mockFeeData: FeeData = {
    maxFeePerGas: new BigNumber("20000000000"),
    maxPriorityFeePerGas: new BigNumber("2000000000"),
    gasPrice: null,
    nextBaseFee: null,
  };

  const mockNodeApi = {
    getGasEstimation: jest.fn().mockResolvedValue(mockGasLimit),
    getFeeData: jest.fn().mockResolvedValue(mockFeeData),
  };

  const expectedTx = (recipient = mockIntent.recipient, chainId = 1): Partial<Transaction> => ({
    family: "evm",
    mode: "send",
    amount: new BigNumber(mockIntent.amount.toString()),
    recipient,
    maxFeePerGas: new BigNumber(0),
    maxPriorityFeePerGas: new BigNumber(0),
    gasLimit: mockGasLimit,
    nonce: 0,
    chainId,
    feesStrategy: "medium",
    type: 2,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockNodeApi.getGasEstimation.mockResolvedValue(mockGasLimit);
    mockNodeApi.getFeeData.mockResolvedValue(mockFeeData);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
  });

  it("should estimate fees for native asset", async () => {
    const result = await estimateFees(mockCurrency, mockIntent);

    expect(mockNodeApi.getFeeData).toHaveBeenCalledWith(mockCurrency, expectedTx());
    expect(result).toBe(BigInt(mockGasLimit.multipliedBy(mockFeeData.maxFeePerGas!).toFixed()));
  });

  it("should estimate fees for token asset", async () => {
    const tokenIntent = { ...mockIntent, asset: mockTokenAsset };
    const result = await estimateFees(mockCurrency, tokenIntent);

    expect(mockNodeApi.getFeeData).toHaveBeenCalledWith(
      mockCurrency,
      expectedTx(mockTokenAsset.contractAddress),
    );
    expect(result).toBe(BigInt(mockGasLimit.multipliedBy(mockFeeData.maxFeePerGas!).toFixed()));
  });

  it("should return 0 when maxFeePerGas is null", async () => {
    mockNodeApi.getFeeData.mockResolvedValue({ ...mockFeeData, maxFeePerGas: null });

    const result = await estimateFees(mockCurrency, mockIntent);
    expect(result).toBe(BigInt(0));
  });
});
