import type {
  AssetInfo,
  BufferTxData,
  MemoNotSupported,
  SendTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { GasEstimationError } from "../errors";
import { getGasTracker } from "../network/gasTracker";
import { getNodeApi } from "../network/node";
import { estimateFees } from "./estimateFees";

jest.mock("../network/node", () => ({ getNodeApi: jest.fn() }));

jest.mock("../network/gasTracker", () => ({
  getGasTracker: jest.fn(),
}));

jest.mock("../network/gasTracker/ledger", () => ({
  __esModule: true,
  default: {
    getGasOptions: jest.fn(),
  },
}));

const mockGetGasTracker = getGasTracker as jest.Mock;

describe("estimateFees", () => {
  const mockCurrency = {
    id: "ethereum",
    family: "evm",
    ethereumLikeInfo: { chainId: 1 },
  } as CryptoCurrency;

  const mockNativeAsset: AssetInfo = { type: "native" };
  const mockIntent: TransactionIntent<MemoNotSupported, BufferTxData> = {
    type: "send-legacy",
    intentType: "transaction",
    amount: BigInt("1000000000000000000"),
    asset: mockNativeAsset,
    recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
    sender: "0xsender",
    feesStrategy: "fast",
    data: { type: "buffer", value: Buffer.from([]) },
  };

  const mockNodeApi = {
    getGasEstimation: jest.fn(),
    getFeeData: jest.fn(),
    getTransactionCount: jest.fn(),
    getOptimismAdditionalFees: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    setCoinConfig(
      () =>
        ({
          info: {
            gasTracker: { type: "ledger", explorerId: "eth" },
          },
        }) as unknown as EvmCoinConfig,
    );
  });

  it("does not try to estimate with an invalid address and returns 0 as fallback", async () => {
    expect(
      await estimateFees(
        {} as CryptoCurrency,
        { type: "send-legacy", recipient: "not-an-address" } as TransactionIntent<
          MemoNotSupported,
          BufferTxData
        >,
      ),
    ).toEqual({ value: 0n });
    expect(mockNodeApi.getGasEstimation).not.toHaveBeenCalled();
  });

  it("estimates fees for native asset and custom fee options", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);

    const result = await estimateFees(
      mockCurrency,
      {
        intentType: "transaction",
        type: "send-legacy",
        amount: BigInt("1000000000000000000"),
        asset: { type: "native" },
        recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
        sender: "0xsender",
        feesStrategy: "fast",
        data: { type: "buffer", value: Buffer.from([]) },
      } as SendTransactionIntent<MemoNotSupported, BufferTxData>,
      {
        gasOptions: {
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: 30000000000n,
            nextBaseFee: null,
          },
          medium: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: 20000000000n,
            nextBaseFee: null,
          },
          slow: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: 10000000000n,
            nextBaseFee: null,
          },
        },
      },
    );

    expect(mockNodeApi.getFeeData).not.toHaveBeenCalled();
    expect(result).toEqual({
      value: 630000000000000n,
      parameters: {
        gasPrice: 30000000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
        gasOptions: {
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: 30000000000n,
            nextBaseFee: null,
          },
          medium: {
            gasPrice: 20000000000n,
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            nextBaseFee: null,
          },
          slow: {
            gasPrice: 10000000000n,
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            nextBaseFee: null,
          },
        },
      },
    });
  });

  it("estimates fees for token asset and remote gas options", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockGetGasTracker.mockReturnValue({
      getGasOptions: jest.fn().mockResolvedValue({
        fast: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber("30000000000"),
          nextBaseFee: null,
        },
        medium: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber("20000000000"),
          nextBaseFee: null,
        },
        slow: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber("10000000000"),
          nextBaseFee: null,
        },
      }),
    });

    const result = await estimateFees(mockCurrency, {
      intentType: "transaction",
      type: "send-legacy",
      amount: BigInt("1000000000000000000"),
      recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
      sender: "0xsender",
      feesStrategy: "fast",
      data: { type: "buffer", value: Buffer.from([]) },
      asset: { type: "erc20", assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    } as SendTransactionIntent<MemoNotSupported, BufferTxData>);

    expect(mockNodeApi.getFeeData).not.toHaveBeenCalled();
    expect(result).toEqual({
      value: 630000000000000n,
      parameters: {
        gasPrice: 30000000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
        gasOptions: {
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: 30000000000n,
            nextBaseFee: null,
          },
          medium: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: 20000000000n,
            nextBaseFee: null,
          },
          slow: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: 10000000000n,
            nextBaseFee: null,
          },
        },
      },
    });
  });

  it("re-adjusts the transaction type", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: new BigNumber(20000000),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);

    const result = await estimateFees(mockCurrency, {
      intentType: "transaction",
      type: "send-eip1559",
      amount: BigInt("1000000000000000000"),
      recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
      sender: "0xsender",
      feesStrategy: "medium",
      data: { type: "buffer", value: Buffer.from([]) },
      asset: { type: "native" },
    } as SendTransactionIntent<MemoNotSupported, BufferTxData>);

    expect(result).toEqual({
      value: 420000000000n,
      parameters: {
        gasPrice: 20000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
      },
    });
  });

  it("uses custom fee data", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);

    const result = await estimateFees(
      mockCurrency,
      {
        intentType: "transaction",
        type: "send-legacy",
        amount: BigInt("1000000000000000000"),
        asset: { type: "native" },
        recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
        sender: "0xsender",
        feesStrategy: "custom",
        data: { type: "buffer", value: Buffer.from([]) },
      } as SendTransactionIntent<MemoNotSupported, BufferTxData>,
      {
        gasPrice: 60000n,
      },
    );

    expect(result).toEqual({
      value: 1260000000n,
      parameters: {
        gasPrice: 60000n,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
      },
    });
  });

  it("returns 0 when gasPrice is null with no custom gas options", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: null,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);

    const result = await estimateFees(mockCurrency, {
      intentType: "transaction",
      type: "send-legacy",
      amount: BigInt("1000000000000000000"),
      asset: { type: "native" },
      recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
      sender: "0xsender",
      feesStrategy: "slow",
      data: { type: "buffer", value: Buffer.from([]) },
    } as SendTransactionIntent<MemoNotSupported, BufferTxData>);

    expect(result).toEqual({
      value: 0n,
      parameters: {
        gasPrice: null,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
      },
    });
  });

  it("returns 0 when gas estimation fails", async () => {
    mockNodeApi.getGasEstimation.mockRejectedValue(new GasEstimationError());
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: null,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);

    const result = await estimateFees(mockCurrency, {
      intentType: "transaction",
      type: "send-legacy",
      amount: BigInt("1000000000000000000"),
      asset: { type: "native" },
      recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
      sender: "0xsender",
      feesStrategy: "slow",
      data: { type: "buffer", value: Buffer.from([]) },
    } as SendTransactionIntent<MemoNotSupported, BufferTxData>);

    expect(result).toEqual({
      value: 0n,
      parameters: {
        gasPrice: null,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 0n,
        type: 0,
      },
    });
  });

  it("embeds additional fees when dealing with layers 2", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: new BigNumber("20000000000"),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);
    mockNodeApi.getOptimismAdditionalFees.mockResolvedValue(new BigNumber(8000));

    const result = await estimateFees(
      { ...mockCurrency, id: "optimism", ethereumLikeInfo: { chainId: 10 } },
      {
        intentType: "transaction",
        type: "send-legacy",
        amount: BigInt("1000000000000000000"),
        asset: { type: "native" },
        recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
        sender: "0xsender",
        data: { type: "buffer", value: Buffer.from([]) },
      },
    );
    expect(result).toEqual({
      value: 420000000000000n,
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
        additionalFees: 8000n,
      },
    });
  });

  it("gives 0 additional fees if the transaction is not deserializable", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: new BigNumber("20000000000"),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);
    mockNodeApi.getOptimismAdditionalFees.mockResolvedValue(new BigNumber(8000));

    const result = await estimateFees(
      { ...mockCurrency, id: "optimism", ethereumLikeInfo: { chainId: 10 } },
      {
        intentType: "transaction",
        type: "send-legacy",
        amount: BigInt("1000000000000000000"),
        asset: { type: "native" },
        // Invalid recipient address, fails with
        // TypeError: bad address checksum (argument="address", value="0x0dFC37693E934F242606CA06417Fb76426442334", code=INVALID_ARGUMENT, version=6.15.0)
        recipient: "0x0dFC37693E934F242606CA06417Fb76426442334",
        sender: "0xsender",
        data: { type: "buffer", value: Buffer.from([]) },
      },
    );
    expect(result).toEqual({
      value: 420000000000000n,
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
        additionalFees: 0n,
      },
    });
  });

  it("estimates fees for delegate and no custom options and no gas tracker", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: new BigNumber("20000000000"),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);

    const tokenIntent = {
      ...mockIntent,
      intentType: "staking" as const,
      mode: "delegate",
      recipient: "0x0000000000000000000000000000000000001005",
      valAddress: "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn",
      amount: 1000000n,
    };
    const result = await estimateFees(
      { ...mockCurrency, id: "sei_evm", ethereumLikeInfo: { chainId: 1329 } },
      tokenIntent,
    );
    expect(result).toEqual({
      value: 420000000000000n,
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
      },
    });
  });

  it("estimates fees for redelegate and no custom options and no gas tracker", async () => {
    mockNodeApi.getGasEstimation.mockResolvedValue(new BigNumber("21000"));
    mockNodeApi.getTransactionCount.mockResolvedValue(42);
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: new BigNumber("20000000000"),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);

    const tokenIntent = {
      ...mockIntent,
      intentType: "staking" as const,
      mode: "redelegate",
      recipient: "0x0000000000000000000000000000000000001005",
      valAddress: "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn",
      dstValAddress: "selfvaloper1uvdqeduxvtchfphueyxraag9qkf8zfznzxs30y",
      amount: 1000000n,
    };
    const result = await estimateFees(
      { ...mockCurrency, id: "sei_evm", ethereumLikeInfo: { chainId: 1329 } },
      tokenIntent,
    );
    expect(result).toEqual({
      value: 420000000000000n,
      parameters: {
        gasPrice: 20000000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 21000n,
        type: 0,
      },
    });
  });

  it("uses custom gas limit from customFeesParameters", async () => {
    jest.mocked(getNodeApi).mockReturnValue(mockNodeApi as any);
    mockNodeApi.getFeeData.mockResolvedValue({
      gasPrice: new BigNumber("20000000000"),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });
    mockGetGasTracker.mockReturnValue(null);

    const result = await estimateFees(
      mockCurrency,
      {
        intentType: "transaction",
        type: "send-legacy",
        amount: BigInt("1000000000000000000"),
        asset: { type: "native" },
        recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
        sender: "0xsender",
        feesStrategy: "custom",
        data: { type: "buffer", value: Buffer.from([]) },
      } as SendTransactionIntent<MemoNotSupported, BufferTxData>,
      {
        gasLimit: 50000n,
        gasPrice: 30000000000n,
      },
    );

    // Should not call getGasEstimation when custom gas limit is provided
    expect(mockNodeApi.getGasEstimation).not.toHaveBeenCalled();

    expect(result).toEqual({
      value: 1500000000000000n, // 50000 * 30000000000
      parameters: {
        additionalFees: 0n,
        gasPrice: 30000000000n,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
        nextBaseFee: null,
        gasLimit: 50000n,
        type: 0,
      },
    });
  });
});
