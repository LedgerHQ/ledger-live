// @flow

import { BigNumber } from "bignumber.js";
import type {
  Exchange,
  ExchangeRate,
  GetMultipleStatus,
  GetProviders,
  SwapRequestEvent,
} from "./types";
import { getAccountCurrency, getAccountUnit } from "../account";
import type { Transaction } from "../types";
import { SwapExchangeRateOutOfBounds } from "../errors";
import { Observable, of } from "rxjs";

export const mockGetExchangeRates = async (
  exchange: Exchange,
  transaction: Transaction
) => {
  const { fromAccount, toAccount } = exchange;
  const amount = transaction.amount;
  const from = getAccountCurrency(fromAccount).id;
  const to = getAccountCurrency(toAccount).id;
  const unitFrom = getAccountUnit(fromAccount);
  const amountFrom = amount.div(BigNumber(10).pow(unitFrom.magnitude));

  if (amountFrom.gte(0.00001) && amountFrom.lte(100000)) {
    //Fake delay to show loading UI
    await new Promise((r) => setTimeout(r, 800));
    //Mock OK, not really magnitude aware
    return [
      {
        rate: BigNumber("4.2"),
        magnitudeAwareRate: BigNumber("4.2"),
        rateId: "mockedRateId",
        provider: "changelly",
        expirationDate: new Date(),
      },
    ];
  } else {
    //Mock KO
    throw new SwapExchangeRateOutOfBounds(null, {
      from,
      to,
      minAmountFrom: 0.00001,
      maxAmountFrom: 10,
    });
  }
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

  return [
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
    },
  ];
};

export const mockGetStatus: GetMultipleStatus = async (statusList) => {
  //Fake delay to show loading UI
  await new Promise((r) => setTimeout(r, 800));
  return statusList.map((s) => ({ ...s, status: "failed" }));
};
