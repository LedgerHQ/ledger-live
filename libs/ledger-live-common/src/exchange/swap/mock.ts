import { BigNumber } from "bignumber.js";
import type {
  Exchange,
  ExchangeRate,
  GetMultipleStatus,
  GetProviders,
  KYCStatus,
  SwapRequestEvent,
  ValidKYCStatus,
} from "./types";
import { getAccountUnit } from "../../account";
import type { Transaction, TokenCurrency, CryptoCurrency } from "../../types";
import { formatCurrencyUnit } from "../../currencies";
import {
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooHigh,
} from "../../errors";
import { Observable, of } from "rxjs";
import { getSwapAPIBaseURL } from "./";

export const getMockExchangeRate = ({
  provider = "changelly",
  tradeMethod = "fixed",
}: {
  provider?: string;
  tradeMethod?: "fixed" | "float";
} = {}): ExchangeRate => ({
  rate: new BigNumber("1"),
  toAmount: new BigNumber("12"),
  magnitudeAwareRate: new BigNumber(1)
    .div(new BigNumber(10).pow(18))
    .times(new BigNumber(10).pow(8)),
  rateId: "mockedRateId",
  provider,
  tradeMethod,
});

export const mockGetExchangeRates = async (
  exchange: Exchange,
  transaction: Transaction,
  currencyTo?: TokenCurrency | CryptoCurrency | undefined | null
): Promise<(ExchangeRate & { expirationDate?: Date })[]> => {
  const { fromAccount, toAccount } = exchange;
  const amount = transaction.amount;
  const unitFrom = getAccountUnit(fromAccount);
  const unitTo =
    (currencyTo && currencyTo.units[0]) ?? getAccountUnit(toAccount);
  const tenPowMagnitude = new BigNumber(10).pow(unitFrom.magnitude);
  const amountFrom = amount.div(tenPowMagnitude);
  const minAmountFrom = new BigNumber(0.0001);
  const maxAmountFrom = new BigNumber(1000);

  if (amountFrom.lte(minAmountFrom)) {
    throw new SwapExchangeRateAmountTooLow(undefined, {
      minAmountFromFormatted: formatCurrencyUnit(
        unitFrom,
        new BigNumber(minAmountFrom).times(tenPowMagnitude),
        {
          alwaysShowSign: false,
          disableRounding: true,
          showCode: true,
        }
      ),
    });
  }

  if (amountFrom.gte(maxAmountFrom)) {
    throw new SwapExchangeRateAmountTooHigh(undefined, {
      maxAmountFromFormatted: formatCurrencyUnit(
        unitFrom,
        new BigNumber(maxAmountFrom).times(tenPowMagnitude),
        {
          alwaysShowSign: false,
          disableRounding: true,
          showCode: true,
        }
      ),
    });
  }

  //Fake delay to show loading UI
  await new Promise((r) => setTimeout(r, 800));
  const magnitudeAwareRate = new BigNumber(1)
    .div(new BigNumber(10).pow(unitFrom.magnitude))
    .times(new BigNumber(10).pow(unitTo.magnitude));
  //Mock OK, not really magnitude aware
  return [
    {
      rate: new BigNumber("1"),
      toAmount: amount.times(magnitudeAwareRate),
      magnitudeAwareRate,
      rateId: "mockedRateId",
      provider: "changelly",
      expirationDate: new Date(),
      tradeMethod: "fixed",
    },
    {
      rate: new BigNumber("1"),
      toAmount: amount.times(magnitudeAwareRate),
      magnitudeAwareRate,
      rateId: "mockedRateId",
      provider: "changelly",
      expirationDate: new Date(),
      tradeMethod: "float",
    },
  ];
};
export const mockInitSwap = (
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  transaction: Transaction
): Observable<SwapRequestEvent> => {
  return of({
    type: "init-swap-result",
    initSwapResult: {
      transaction,
      swapId: "mockedSwapId",
    },
  });
};
export const mockGetProviders: GetProviders = async () => {
  //Fake delay to show loading UI
  await new Promise((r) => setTimeout(r, 800));
  const usesV3 = getSwapAPIBaseURL().endsWith("v3");

  return usesV3
    ? [
        {
          provider: "changelly",
          pairs: [
            { from: "bitcoin", to: "ethereum", tradeMethod: "float" },
            { from: "bitcoin", to: "ethereum", tradeMethod: "fixed" },
            { from: "ethereum", to: "bitcoin", tradeMethod: "float" },
            { from: "ethereum", to: "bitcoin", tradeMethod: "fixed" },
          ],
        },
        {
          provider: "wyre",
          pairs: [
            { from: "bitcoin", to: "ethereum", tradeMethod: "float" },
            { from: "bitcoin", to: "ethereum", tradeMethod: "fixed" },
            { from: "ethereum", to: "bitcoin", tradeMethod: "float" },
            { from: "ethereum", to: "bitcoin", tradeMethod: "fixed" },
          ],
        },
      ]
    : [
        {
          provider: "changelly",
          supportedCurrencies: [
            "bitcoin",
            "litecoin",
            "ethereum",
            "tron",
            "ethereum/erc20/omg",
            "ethereum/erc20/0x_project",
            "ethereum/erc20/augur",
          ],
          tradeMethod: "fixed",
        },
        {
          provider: "changelly",
          supportedCurrencies: [
            "bitcoin",
            "litecoin",
            "ethereum",
            "tron",
            "ethereum/erc20/omg",
            "ethereum/erc20/0x_project",
            "ethereum/erc20/augur",
          ],
          tradeMethod: "float",
        },
      ];
};
export const mockGetStatus: GetMultipleStatus = async (statusList) => {
  //Fake delay to show loading UI
  await new Promise((r) => setTimeout(r, 800));
  return statusList.map((s) => ({ ...s, status: "finished" }));
};

export const mockGetKYCStatus = async (
  id: string,
  status: ValidKYCStatus
): Promise<KYCStatus> => {
  //Fake delay to show the pending state in the UI
  await new Promise((r) => setTimeout(r, 2000));
  return { id, status };
};
