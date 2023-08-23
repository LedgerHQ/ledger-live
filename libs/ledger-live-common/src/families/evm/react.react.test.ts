import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react-hooks";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { getGasTracker } from "@ledgerhq/coin-evm/api/gasTracker/index";
import type { GasTrackerApi } from "@ledgerhq/coin-evm/api/gasTracker/types";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { useGasOptions } from "./react";

jest.useFakeTimers();
jest.spyOn(global, "setInterval");

jest.mock("@ledgerhq/coin-evm/api/gasTracker/index");
const mockedGetGasTracker = jest.mocked(getGasTracker, true);

const mockedGetGasOptions = jest.fn();

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
    node: {
      type: "ledger",
      explorerId: "eth",
    },
    gasTracker: {
      type: "ledger",
      explorerId: "eth",
    },
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};

const coinTransaction: Transaction = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0x997e135e96114c0E84FFc58754552368E4abf329",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
};

const expectedGasOptions = {
  slow: {
    maxFeePerGas: new BigNumber(9),
    maxPriorityFeePerGas: new BigNumber(1),
    gasPrice: null,
    nextBaseFee: new BigNumber(4),
  },
  medium: {
    maxFeePerGas: new BigNumber(10),
    maxPriorityFeePerGas: new BigNumber(2),
    gasPrice: null,
    nextBaseFee: new BigNumber(4),
  },
  fast: {
    maxFeePerGas: new BigNumber(11),
    maxPriorityFeePerGas: new BigNumber(3),
    gasPrice: null,
    nextBaseFee: new BigNumber(4),
  },
};

describe("useGasOptions", () => {
  beforeEach(() => {
    mockedGetGasTracker.mockImplementation(() => ({ getGasOptions: mockedGetGasOptions }));
    mockedGetGasOptions.mockReturnValueOnce(Promise.resolve(expectedGasOptions));
  });

  afterEach(() => {
    mockedGetGasTracker.mockReset();
    mockedGetGasOptions.mockReset();
  });

  test("call hook with interval = 0", async () => {
    const { result, waitForNextUpdate } = renderHook(() => {
      return useGasOptions({
        currency: fakeCurrency as CryptoCurrency,
        transaction: coinTransaction,
        interval: 0,
      });
    });

    await waitForNextUpdate();

    expect(mockedGetGasTracker).toHaveBeenCalledTimes(1);
    expect(mockedGetGasTracker).toHaveReturnedWith<GasTrackerApi>({
      getGasOptions: mockedGetGasOptions,
    });
    expect(mockedGetGasOptions).toHaveBeenCalledTimes(1);

    expect(setInterval).toHaveBeenCalledTimes(0);

    expect(result.current).toMatchObject([expectedGasOptions, null]);
  });

  test("call hook with interval < 0", async () => {
    const { result, waitForNextUpdate } = renderHook(() => {
      return useGasOptions({
        currency: fakeCurrency as CryptoCurrency,
        transaction: coinTransaction,
        interval: -1,
      });
    });

    await waitForNextUpdate();

    expect(mockedGetGasTracker).toHaveBeenCalledTimes(1);
    expect(mockedGetGasTracker).toHaveReturnedWith<GasTrackerApi>({
      getGasOptions: mockedGetGasOptions,
    });
    expect(mockedGetGasOptions).toHaveBeenCalledTimes(1);

    expect(setInterval).toHaveBeenCalledTimes(0);

    expect(result.current).toMatchObject([expectedGasOptions, null]);
  });

  test("call hook with interval > 0", async () => {
    const { result, waitForNextUpdate } = renderHook(() => {
      return useGasOptions({
        currency: fakeCurrency as CryptoCurrency,
        transaction: coinTransaction,
        interval: 1,
      });
    });

    await waitForNextUpdate();

    expect(mockedGetGasTracker).toHaveBeenCalledTimes(1);
    expect(mockedGetGasTracker).toHaveReturnedWith<GasTrackerApi>({
      getGasOptions: mockedGetGasOptions,
    });
    expect(mockedGetGasOptions).toHaveBeenCalledTimes(1);

    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1);

    expect(result.current).toMatchObject([expectedGasOptions, null]);
  });

  test("should use EIP-1559 when transaction is type 2", async () => {
    const { waitForNextUpdate } = renderHook(() => {
      return useGasOptions({
        currency: fakeCurrency as CryptoCurrency,
        transaction: coinTransaction,
        interval: 0,
      });
    });

    await waitForNextUpdate();

    expect(mockedGetGasOptions).toHaveBeenCalledWith({
      currency: fakeCurrency,
      options: { useEIP1559: true },
    });
  });

  test("should not use EIP-1559 when transaction is not type 2", async () => {
    const { waitForNextUpdate } = renderHook(() => {
      return useGasOptions({
        currency: fakeCurrency as CryptoCurrency,
        transaction: {
          ...coinTransaction,
          type: 0,
          gasPrice: new BigNumber(10),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
        },
        interval: 0,
      });
    });

    await waitForNextUpdate();

    expect(mockedGetGasOptions).toHaveBeenCalledWith({
      currency: fakeCurrency,
      options: { useEIP1559: false },
    });
  });

  test("should not return gasOption if can't get gas tracker", async () => {
    mockedGetGasTracker.mockImplementationOnce(() => null);

    const { result } = renderHook(() => {
      return useGasOptions({
        currency: fakeCurrency as CryptoCurrency,
        transaction: coinTransaction,
        interval: 0,
      });
    });

    expect(mockedGetGasTracker).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject([undefined, null]);
  });

  test("should return error if getGasOptions throws", async () => {
    const expectedError = new Error("error");

    mockedGetGasOptions.mockReset();
    mockedGetGasOptions.mockReturnValueOnce(Promise.reject(expectedError));

    const { result, waitForNextUpdate } = renderHook(() => {
      return useGasOptions({
        currency: fakeCurrency as CryptoCurrency,
        transaction: coinTransaction,
        interval: 0,
      });
    });

    await waitForNextUpdate();

    expect(result.current).toMatchObject([undefined, expectedError]);
  });
});
