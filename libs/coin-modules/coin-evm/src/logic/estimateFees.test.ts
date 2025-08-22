import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  AssetInfo,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { getNodeApi } from "../network/node";
import { FeeData } from "../types";
import { estimateFees } from "./estimateFees";

jest.mock("../network/node", () => ({ getNodeApi: jest.fn() }));

describe("estimateFees", () => {
  const mockCurrency = {
    id: "ethereum",
    family: "evm",
    ethereumLikeInfo: { chainId: 1 },
  } as CryptoCurrency;
  const mockNativeAsset: AssetInfo = { type: "native" };
  const mockTokenAsset: AssetInfo = { type: "erc20", assetReference: "0x1234" };
  const mockIntent: TransactionIntent<MemoNotSupported> = {
    type: "send-legacy",
    amount: BigInt("1000000000000000000"),
    asset: mockNativeAsset,
    recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
    sender: "0xsender",
    feesStrategy: "fast",
  };

  const mockGasLimit = new BigNumber("21000");
  const mockFeeData: FeeData = {
    maxFeePerGas: new BigNumber("20000000000"),
    maxPriorityFeePerGas: new BigNumber("2000000000"),
    gasPrice: new BigNumber("20000000000"),
    nextBaseFee: null,
  };

  const mockNodeApi = {
    getGasEstimation: jest.fn().mockResolvedValue(mockGasLimit),
    getFeeData: jest.fn().mockResolvedValue(mockFeeData),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNodeApi.getGasEstimation.mockResolvedValue(mockGasLimit);
    mockNodeApi.getFeeData.mockResolvedValue(mockFeeData);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
  });

  it("should estimate fees for native asset", async () => {
    const result = await estimateFees(mockCurrency, mockIntent);

    expect(mockNodeApi.getFeeData).toHaveBeenCalledWith(mockCurrency, {
      feesStrategy: "fast",
      type: 0,
    });
    expect(result).toEqual({
      value: BigInt(mockGasLimit.multipliedBy(mockFeeData.gasPrice!).toFixed()),
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        nextBaseFee: null,
      },
    });
  });

  it("should estimate fees for token asset", async () => {
    const tokenIntent = { ...mockIntent, asset: mockTokenAsset };
    const result = await estimateFees(mockCurrency, tokenIntent);

    expect(mockNodeApi.getFeeData).toHaveBeenCalledWith(mockCurrency, {
      feesStrategy: "fast",
      type: 0,
    });
    expect(result).toEqual({
      value: BigInt(mockGasLimit.multipliedBy(mockFeeData.gasPrice!).toFixed()),
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        nextBaseFee: null,
      },
    });
  });

  it("should return 0 when gasPrice is null", async () => {
    mockNodeApi.getFeeData.mockResolvedValue({ ...mockFeeData, gasPrice: null });

    const result = await estimateFees(mockCurrency, mockIntent);
    expect(result).toEqual({
      value: BigInt(0),
      parameters: {
        gasPrice: null,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        nextBaseFee: null,
      },
    });
  });
});
