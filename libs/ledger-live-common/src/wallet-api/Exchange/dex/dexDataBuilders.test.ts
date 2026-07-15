import BigNumber from "bignumber.js";

import { buildProviderTransactionData } from "./dexDataBuilders";

const mockGetUniswapTransaction = jest.fn();
const mockGetOneinchTransaction = jest.fn();
const mockGetVeloraTransaction = jest.fn();
const mockGetOkxTransaction = jest.fn();

jest.mock("./swap-api/uniswap", () => ({
  getUniswapTransaction: (...args: unknown[]) => mockGetUniswapTransaction(...args),
}));

jest.mock("./swap-api/oneinch", () => ({
  getOneinchTransaction: (...args: unknown[]) => mockGetOneinchTransaction(...args),
}));

jest.mock("./swap-api/velora", () => ({
  getVeloraTransaction: (...args: unknown[]) => mockGetVeloraTransaction(...args),
}));

jest.mock("./swap-api/okx", () => ({
  getOkxTransaction: (...args: unknown[]) => mockGetOkxTransaction(...args),
}));

describe("dexDataBuilders gas normalization", () => {
  const baseContext = {
    customFields: {},
    permitSignature: undefined,
    fromCurrencyId: "ethereum",
    toCurrencyId: "bitcoin",
    fromAccountAddress: "0x123",
    amountFrom: new BigNumber(1),
    slippage: 0.5,
    gasLimitMultiplier: 1.3,
    defaultGasLimit: "1500000",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adjusts Uniswap gas limit using legacy safety margin", async () => {
    mockGetUniswapTransaction.mockResolvedValue({
      swap: {
        to: "0xto",
        data: "0xdata",
        value: "0",
        gasLimit: "1000",
      },
    });

    const result = await buildProviderTransactionData("uniswap", baseContext);

    expect(result.appName).toBe("Uniswap");
    expect(result.partner).toBe("uniswap");
    expect(result.transactionData.gasLimit).toBe("1300");
  });

  it("adjusts Velora gas limit using legacy safety margin", async () => {
    mockGetVeloraTransaction.mockResolvedValue({
      to: "0xto",
      data: "0xdata",
      value: 0,
      gasLimit: 2000,
    });

    const result = await buildProviderTransactionData("velora", baseContext);

    expect(result.appName).toBe("Velora");
    expect(result.partner).toBe("velora");
    expect(result.transactionData.gasLimit).toBe("2600");
  });

  it("uses normalized fallback when 1inch gas limit is missing", async () => {
    mockGetOneinchTransaction.mockResolvedValue({
      to: "0xto",
      data: "0xdata",
      value: "0",
      gasLimit: undefined,
    });

    const result = await buildProviderTransactionData("oneinch", baseContext);

    expect(result.appName).toBe("1inch");
    expect(result.partner).toBe("oneinch");
    expect(result.transactionData.gasLimit).toBe("1500000");
  });
});
