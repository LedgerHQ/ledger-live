import { BigNumber } from "bignumber.js";
import { Observable, of } from "rxjs";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { SwapExchangeRateAmountTooHigh, SwapExchangeRateAmountTooLow } from "../../errors";
import type {
  Exchange,
  ExchangeRate,
  GetMultipleStatus,
  PostSwapAccepted,
  PostSwapCancelled,
  SwapRequestEvent,
} from "./types";
import type { Transaction } from "../../generated/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const mockGetExchangeRates = async (
  exchange: Exchange,
  transaction: Transaction,
  currencyTo?: TokenCurrency | CryptoCurrency | undefined | null,
): Promise<(ExchangeRate & { expirationDate?: Date })[]> => {
  const { fromAccount, toAccount } = exchange;
  const amount = transaction.amount;
  const unitFrom = getAccountUnit(fromAccount);
  const unitTo = (currencyTo && currencyTo.units[0]) ?? getAccountUnit(toAccount);
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
        },
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
        },
      ),
    });
  }

  //Fake delay to show loading UI
  await new Promise(r => setTimeout(r, 800));
  const magnitudeAwareRate = new BigNumber(1)
    .div(new BigNumber(10).pow(unitFrom.magnitude))
    .times(new BigNumber(10).pow(unitTo.magnitude));
  //Mock OK, not really magnitude aware
  return [
    {
      rate: new BigNumber("1"),
      toAmount: amount.times(magnitudeAwareRate),
      magnitudeAwareRate,
      rateId: "changellyRateId1",
      provider: "changelly",
      providerType: "CEX",
      expirationDate: new Date(),
      tradeMethod: "fixed",
    },
    {
      rate: new BigNumber("1.1"),
      toAmount: amount.times(magnitudeAwareRate),
      magnitudeAwareRate,
      rateId: "changellyRateId2",
      provider: "changelly",
      providerType: "CEX",
      expirationDate: new Date(),
      tradeMethod: "float",
    },
    {
      rate: new BigNumber("0.9"),
      toAmount: amount.times(magnitudeAwareRate),
      magnitudeAwareRate,
      rateId: "cicRateId1",
      provider: "cic",
      providerType: "CEX",
      expirationDate: new Date(),
      tradeMethod: "float",
    },
    {
      rate: new BigNumber("0.95"),
      toAmount: amount.times(magnitudeAwareRate),
      magnitudeAwareRate,
      rateId: "1inchRateId1",
      provider: "oneinch",
      providerType: "DEX",
      expirationDate: new Date(),
      tradeMethod: "float",
      providerURL: `/platform/1inch/#/1/unified/swap/eth/usdt?sourceTokenAmount=${transaction.amount}`,
    },
  ];
};

export const mockInitSwap = (
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  transaction: Transaction,
): Observable<SwapRequestEvent> => {
  return of({
    type: "init-swap-result",
    initSwapResult: {
      transaction,
      swapId: "mockedSwapId",
    },
  });
};

export const mockGetStatus: GetMultipleStatus = async statusList => {
  //Fake delay to show loading UI
  await new Promise(r => setTimeout(r, 800));
  return statusList.map(s => ({ ...s, status: "finished" }));
};

export const mockPostSwapAccepted: PostSwapAccepted = async ({
  /* eslint-disable @typescript-eslint/no-unused-vars */
  provider,
  swapId,
  transactionId,
  /* eslint-enable */
}) => {
  //Fake delay to simulate network
  await new Promise(r => setTimeout(r, 800));

  return null;
};

export const mockPostSwapCancelled: PostSwapCancelled = async ({
  /* eslint-disable @typescript-eslint/no-unused-vars */
  provider,
  swapId,
  /* eslint-enable */
}) => {
  //Fake delay to simulate network
  await new Promise(r => setTimeout(r, 800));

  return null;
};
