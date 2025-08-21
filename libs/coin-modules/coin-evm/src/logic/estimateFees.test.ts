import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  AssetInfo,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { getNodeApi } from "../network/node";
import { FeeData } from "../types";
import ledgerGasTracker from "../network/gasTracker/ledger";
import { EvmCoinConfig, setCoinConfig } from "../config";
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

    setCoinConfig(
      () =>
        ({
          info: {
            gasTracker: { type: "ledger", explorerId: "eth" },
          },
        }) as unknown as EvmCoinConfig,
    );
  });

  it("should estimate fees for native asset", async () => {
    jest.spyOn(ledgerGasTracker, "getGasOptions").mockResolvedValue({
      fast: {
        maxFeePerGas: new BigNumber("30000000000"),
        maxPriorityFeePerGas: new BigNumber("3000000000"),
        gasPrice: new BigNumber("30000000000"),
        nextBaseFee: null,
      },
      medium: {
        maxFeePerGas: new BigNumber("20000000000"),
        maxPriorityFeePerGas: new BigNumber("2000000000"),
        gasPrice: new BigNumber("20000000000"),
        nextBaseFee: null,
      },
      slow: {
        maxFeePerGas: new BigNumber("10000000000"),
        maxPriorityFeePerGas: new BigNumber("1000000000"),
        gasPrice: new BigNumber("10000000000"),
        nextBaseFee: null,
      },
    });

    const result = await estimateFees(mockCurrency, mockIntent);

    expect(mockNodeApi.getFeeData).toHaveBeenCalledWith(mockCurrency, {
      feesStrategy: "fast",
      type: 0,
    });
    expect(result).toEqual({
      value: 420000000000000n,
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        nextBaseFee: null,
        gasLimit: 21000n,
        gasOptions: {
          fast: {
            maxFeePerGas: 30000000000n,
            maxPriorityFeePerGas: 3000000000n,
            gasPrice: 30000000000n,
            nextBaseFee: null,
          },
          medium: {
            gasPrice: 20000000000n,
            maxFeePerGas: 20000000000n,
            maxPriorityFeePerGas: 2000000000n,
            nextBaseFee: null,
          },
          slow: {
            gasPrice: 10000000000n,
            maxFeePerGas: 10000000000n,
            maxPriorityFeePerGas: 1000000000n,
            nextBaseFee: null,
          },
        },
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
      value: 420000000000000n,
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        nextBaseFee: null,
        gasLimit: 21000n,
        gasOptions: {
          fast: {
            maxFeePerGas: 30000000000n,
            maxPriorityFeePerGas: 3000000000n,
            gasPrice: 30000000000n,
            nextBaseFee: null,
          },
          medium: {
            gasPrice: 20000000000n,
            maxFeePerGas: 20000000000n,
            maxPriorityFeePerGas: 2000000000n,
            nextBaseFee: null,
          },
          slow: {
            gasPrice: 10000000000n,
            maxFeePerGas: 10000000000n,
            maxPriorityFeePerGas: 1000000000n,
            nextBaseFee: null,
          },
        },
      },
    });
  });

  it("should return 0 when gasPrice is null", async () => {
    mockNodeApi.getFeeData.mockResolvedValue({ ...mockFeeData, gasPrice: null });

    const result = await estimateFees(mockCurrency, mockIntent);
    expect(result).toEqual({
      value: 0n,
      parameters: {
        gasPrice: null,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        nextBaseFee: null,
        gasLimit: 21000n,
        gasOptions: {
          fast: {
            maxFeePerGas: 30000000000n,
            maxPriorityFeePerGas: 3000000000n,
            gasPrice: 30000000000n,
            nextBaseFee: null,
          },
          medium: {
            gasPrice: 20000000000n,
            maxFeePerGas: 20000000000n,
            maxPriorityFeePerGas: 2000000000n,
            nextBaseFee: null,
          },
          slow: {
            gasPrice: 10000000000n,
            maxFeePerGas: 10000000000n,
            maxPriorityFeePerGas: 1000000000n,
            nextBaseFee: null,
          },
        },
      },
    });
  });

  it.each([
    [
      "legacy",
      {
        value: 8n,
        parameters: {
          gasPrice: 5n,
        },
      },
    ],
    [
      "eip1559",
      {
        value: 8n,
        parameters: {
          maxFeePerGas: 2n,
          maxPriorityFeePerGas: 3n,
        },
      },
    ],
  ])("uses the given fees for a %s transaction type", async (type, customFees) => {
    const getFeeData = jest.spyOn(mockNodeApi, "getFeeData");
    const getGasEstimation = jest.spyOn(mockNodeApi, "getGasEstimation");

    expect(
      await estimateFees(
        {} as CryptoCurrency,
        { type: `send-${type}` } as unknown as TransactionIntent,
        customFees,
      ),
    ).toEqual(customFees);
    expect(getFeeData).not.toHaveBeenCalled();
    expect(getGasEstimation).not.toHaveBeenCalled();
  });

  it("ignores malformed or irrelevant custom fees", async () => {
    const getFeeData = jest.spyOn(mockNodeApi, "getFeeData");
    const getGasEstimation = jest.spyOn(mockNodeApi, "getGasEstimation");

    expect(
      await estimateFees(
        {} as CryptoCurrency,
        {
          type: "send-eip1559",
          amount: 3n,
          asset: { type: "native" },
        } as unknown as TransactionIntent,
        { value: 8n, parameters: { gasPrice: 5n } },
      ),
    ).not.toEqual({ value: 8n, parameters: { gasPrice: 5n } });
    expect(getFeeData).toHaveBeenCalled();
    expect(getGasEstimation).toHaveBeenCalled();
  });
});
