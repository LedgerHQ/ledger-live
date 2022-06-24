import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import axios from "axios";
import BigNumber from "bignumber.js";
import { Account, Transaction } from "../../types";
import getExchangeRates from "./getExchangeRates";
import { Exchange, ExchangeRate } from "./types";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

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
    pickUnconfirmedRBF: false,
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
        rateId: "RATE_ID",
        from: "bitcoin",
        to: "ethereum",
        amountFrom: "0.005",
        amountTo: "0.07",
        rate: "14",
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
    const res = await getExchangeRates(exchange, transaction);

    const expectedExchangeRate: ExchangeRate = {
      magnitudeAwareRate: new BigNumber("140000000000"),
      provider: data[0].provider,
      rate: new BigNumber(data[0].rate),
      rateId: data[0].rateId,
      toAmount: new BigNumber("70000000000000000"),
      tradeMethod: data[0].tradeMethod,
    };

    expect(res).toEqual([expectedExchangeRate]);
  });

  test("rate should be valid for 'float' trade method", async () => {
    const tradeMethod: "fixed" | "float" = "float";

    const data = [
      {
        provider: "changelly",
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
    const res = await getExchangeRates(exchange, transaction);

    const expectedExchangeRate: ExchangeRate = {
      magnitudeAwareRate: new BigNumber("133913600000"),
      provider: data[0].provider,
      rate: new BigNumber(13.39136),
      toAmount: new BigNumber("66956800000000000"),
      tradeMethod: data[0].tradeMethod,
      payoutNetworkFees: new BigNumber("3043200000000000"),
    };

    expect(res).toEqual([expectedExchangeRate]);
  });
});
