import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import axios from "axios";
import BigNumber from "bignumber.js";
import type { Transaction } from "../../generated/types";
import getExchangeRates from "./getExchangeRates";
import getProviders from "./getProviders";
import { Exchange, ExchangeRate } from "./types";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);
jest.mock("./getProviders");
const mockedProviders = jest.mocked(getProviders);

const providers = [
  {
    provider: "changelly",
    pairs: [{ from: "bitcoin", to: "ethereum", tradeMethod: "float" }],
  },
  {
    provider: "oneinch",
    pairs: [{ from: "bitcoin", to: "ethereum", tradeMethod: "float" }],
  },
];

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const ethereumCurrency = getCryptoCurrencyById("ethereum");

const fromAccount: Account = {
  type: "Account",
  id: "TEST_ID",
  seedIdentifier: "SEED_IDENTIFIER",
  derivationMode: "",
  index: 0,
  freshAddress: "freshAddress",
  freshAddressPath: "freshAddressPath",
  freshAddresses: [],
  name: "TEST_ACCOUNT",
  starred: false,
  used: false,
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
  creationDate: new Date(),
  blockHeight: 0,
  currency: bitcoinCurrency,
  unit: bitcoinCurrency.units[0],
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};

const toAccount = {
  ...fromAccount,
  currency: ethereumCurrency,
  unit: ethereumCurrency.units[0],
};

const exchange: Exchange = {
  fromAccount,
  toAccount,
  fromParentAccount: undefined,
  toParentAccount: undefined,
};

const transaction: Transaction = {
  amount: new BigNumber(10000),
  recipient: "recipient",
  family: "bitcoin",
  utxoStrategy: {
    strategy: 0,
    excludeUTXOs: [],
  },
  rbf: true,
  feePerByte: undefined,
  networkInfo: undefined,
};

describe("swap/getExchangeRates", () => {
  test("rate should be valid for 'fixed' trade method", async () => {
    const tradeMethod: "fixed" | "float" = "fixed";

    const data = [
      {
        provider: "changelly",
        providerType: "CEX",
        rateId: "RATE_ID",
        from: "bitcoin",
        to: "ethereum",
        amountFrom: "0.005",
        amountTo: "0.07",
        rate: "14",
        tradeMethod,
        status: "success",
        payoutNetworkFees: "0.0030432000000000000000",
      },
    ];
    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const res = await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers,
      true
    );

    const expectedExchangeRate: ExchangeRate = {
      magnitudeAwareRate: new BigNumber("140000000000"),
      provider: data[0].provider,
      providerType: data[0].providerType as ExchangeRate["providerType"],
      rate: new BigNumber(data[0].rate),
      rateId: data[0].rateId,
      toAmount: new BigNumber("66956800000000000"),
      tradeMethod: data[0].tradeMethod,
      payoutNetworkFees: new BigNumber("3043200000000000"),
    };

    expect(res).toEqual([expectedExchangeRate]);
  });

  test("rate should be valid for 'float' trade method", async () => {
    const tradeMethod: "fixed" | "float" = "float";

    const data = [
      {
        provider: "changelly",
        providerType: "CEX",
        from: "bitcoin",
        to: "ethereum",
        amountFrom: "0.005",
        amountTo: "0.07",
        minAmountFrom: "0.0015",
        maxAmountFrom: "1445",
        payoutNetworkFees: "0.0030432000000000000000",
        tradeMethod,
        status: "success",
      },
    ];
    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const res = await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers,
      true
    );

    const expectedExchangeRate: ExchangeRate = {
      magnitudeAwareRate: new BigNumber("133913600000"),
      provider: data[0].provider,
      providerType: data[0].providerType as ExchangeRate["providerType"],
      rate: new BigNumber(13.39136),
      toAmount: new BigNumber("66956800000000000"),
      tradeMethod: data[0].tradeMethod,
      payoutNetworkFees: new BigNumber("3043200000000000"),
    };

    expect(res).toEqual([expectedExchangeRate]);
  });

  it("should query for CEX providers only", async () => {
    const resp = {
      data: [],
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const includeDEX = false;
    await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers,
      includeDEX
    );
    expect(mockedAxios).toHaveBeenCalledWith({
      method: "POST",
      url: "https://swap.ledger.com/v4/rate",
      data: {
        amountFrom: "0.0001",
        from: "bitcoin",
        providers: ["changelly"],
        to: "ethereum",
      },
      headers: expect.anything(),
    });
  });

  it("should query for CEX and DEX providers", async () => {
    const resp = {
      data: [],
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const includeDEX = true;
    await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers,
      includeDEX
    );
    expect(mockedAxios).toHaveBeenCalledWith({
      method: "POST",
      url: "https://swap.ledger.com/v4/rate",
      data: {
        amountFrom: "0.0001",
        from: "bitcoin",
        providers: ["changelly", "oneinch"],
        to: "ethereum",
      },
      headers: expect.anything(),
    });
  });
  test("shout not query for providers which is not compatible with the requested pair", async () => {
    const providers = [
      {
        provider: "changelly",
        pairs: [{ from: "bitcoin", to: "ethereum", tradeMethod: "float" }],
      },
      {
        provider: "oneinch",
        pairs: [{ from: "binance", to: "ethereum", tradeMethod: "float" }],
      },
    ];

    const resp = {
      data: [],
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const includeDEX = true;
    await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers,
      includeDEX
    );
    expect(mockedAxios).toHaveBeenCalledWith({
      method: "POST",
      url: "https://swap.ledger.com/v4/rate",
      data: {
        amountFrom: "0.0001",
        from: "bitcoin",
        providers: ["changelly"],
        to: "ethereum",
      },
      headers: expect.anything(),
    });
  });
  test("should return correct error SwapExchangeRateAmountTooHigh", async () => {
    const data = [
      {
        provider: "changelly",
        providerType: "CEX",
        from: "ethereum",
        to: "ethereum/erc20/usd_tether__erc20_",
        amountRequested: "1e-15",
        minAmountFrom: "0.00000001",
        maxAmountFrom: "0.00000008",
        tradeMethod: "fixed",
        status: "error",
      },
    ];
    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const res = await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers
    );
    expect(res[0]?.error?.name).toEqual("SwapExchangeRateAmountTooHigh");
  });

  test("should return correct error SwapExchangeRateAmountTooLow", async () => {
    const data = [
      {
        provider: "changelly",
        providerType: "CEX",
        from: "ethereum",
        to: "ethereum/erc20/usd_tether__erc20_",
        amountRequested: "1e-15",
        minAmountFrom: "0.08045622",
        maxAmountFrom: "105.00000000",
        tradeMethod: "fixed",
        status: "error",
      },
    ];
    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const res = await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers
    );
    expect(res[0]?.error?.name).toEqual("SwapExchangeRateAmountTooLow");
  });
  test("should return correct error SwapExchangeRateAmountTooLowOrTooHigh", async () => {
    const data = [
      {
        provider: "paraswap",
        providerType: "DEX",
        from: "ethereum",
        to: "ethereum/erc20/usd_tether__erc20_",
        tradeMethod: "float",
        errorCode: 500,
        errorMessage: "Failed to get rate for paraswap.",
        status: "error",
      },
    ];
    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    mockedProviders.mockResolvedValue(Promise.resolve([]));
    const res = await getExchangeRates(
      exchange,
      transaction,
      undefined,
      undefined,
      providers
    );
    expect(res[0]?.error?.name).toEqual(
      "SwapExchangeRateAmountTooLowOrTooHigh"
    );
  });
});
