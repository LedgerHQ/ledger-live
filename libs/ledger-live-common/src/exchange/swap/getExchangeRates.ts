import type {
  CryptoCurrency,
  TokenCurrency,
  Unit,
} from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { getAccountCurrency, getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { getEnv } from "../../env";
import {
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLow,
} from "../../errors";
import network from "../../network";
import type { Transaction } from "../../generated/types";
import { getSwapAPIBaseURL, getSwapAPIError } from "./";
import { mockGetExchangeRates } from "./mock";
import type {
  CustomMinOrMaxError,
  Exchange,
  GetExchangeRates,
  AvailableProviderV3,
} from "./types";
import { getMainAccount } from "../../account";

const getExchangeRates: GetExchangeRates = async (
  exchange: Exchange,
  transaction: Transaction,
  userId?: string, // TODO remove when wyre doesn't require this for rates
  currencyTo?: TokenCurrency | CryptoCurrency | undefined | null,
  providers: AvailableProviderV3[] = [],
  includeDEX = false
) => {
  if (getEnv("MOCK"))
    return mockGetExchangeRates(exchange, transaction, currencyTo);

  const from = getAccountCurrency(exchange.fromAccount).id;
  const unitFrom = getAccountUnit(exchange.fromAccount);
  const unitTo =
    (currencyTo && currencyTo.units[0]) ?? getAccountUnit(exchange.toAccount);
  const to = (currencyTo ?? getAccountCurrency(exchange.toAccount)).id;
  const amountFrom = transaction.amount;
  const tenPowMagnitude = new BigNumber(10).pow(unitFrom.magnitude);
  const apiAmount = new BigNumber(amountFrom).div(tenPowMagnitude);

  const dexProviders = ["paraswap", "oneinch"];

  const providerList = providers
    .filter((item) => {
      const index = item.pairs.findIndex(
        (pair) =>
          pair.from === from &&
          pair.to === to &&
          (includeDEX || !dexProviders.includes(item.provider))
      );
      return index > -1;
    })
    .map((item) => item.provider);

  const decentralizedSwapAvailable = () => {
    const {
      fromAccount: sourceAccount,
      toAccount: targetAccount,
      fromParentAccount: sourceParentAccount,
      toParentAccount: targetParentAccount,
    } = exchange;

    if (sourceAccount && targetAccount) {
      const sourceMainAccount = getMainAccount(
        sourceAccount,
        sourceParentAccount
      );
      const targetMainAccount = getMainAccount(
        targetAccount,
        targetParentAccount
      );
      const dexFamilyList = ["ethereum", "binance", "polygon"];
      if (
        dexFamilyList.includes(targetMainAccount.currency.family) &&
        sourceMainAccount.currency.id === targetMainAccount.currency.id
      ) {
        return true;
      }
    }
    return false;
  };

  const request = {
    from,
    to,
    amountFrom: apiAmount.toString(),
    providers: providerList,
  };
  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/rate`,
    headers: {
      ...(userId ? { userId } : {}),
    },
    data: request,
  });

  const rates = res.data.map((responseData) => {
    const {
      rate: maybeRate,
      payoutNetworkFees: maybePayoutNetworkFees,
      rateId,
      provider,
      amountFrom,
      amountTo,
      tradeMethod,
    } = responseData;

    const error = inferError(apiAmount, unitFrom, responseData);
    if (error) {
      return {
        provider,
        tradeMethod,
        error,
      };
    }

    const payoutNetworkFees = new BigNumber(maybePayoutNetworkFees || 0);

    const magnitudeAwarePayoutNetworkFees = payoutNetworkFees.times(
      new BigNumber(10).pow(unitTo.magnitude)
    );

    const rate = maybeRate
      ? new BigNumber(maybeRate)
      : new BigNumber(amountTo).minus(payoutNetworkFees).div(amountFrom);

    // NB Allows us to simply multiply satoshi values from/to
    const magnitudeAwareRate = rate.div(
      new BigNumber(10).pow(unitFrom.magnitude - unitTo.magnitude)
    );

    const toAmount = new BigNumber(amountTo).minus(payoutNetworkFees);

    const magnitudeAwareToAmount = toAmount.times(
      new BigNumber(10).pow(unitTo.magnitude)
    );
    // Nb no longer need to break it down on UI

    const out = {
      magnitudeAwareRate,
      provider,
      rate,
      rateId,
      toAmount: magnitudeAwareToAmount,
      tradeMethod,
    };

    if (tradeMethod === "fixed") {
      return { ...out, rateId };
    } else {
      return {
        ...out,
        payoutNetworkFees: magnitudeAwarePayoutNetworkFees,
      };
    }
  });
  if (includeDEX && decentralizedSwapAvailable()) {
    dexProviders.filter((dexProvider) => {
      if (!providerList.includes(dexProvider)) {
        rates.push({
          magnitudeAwareRate: undefined,
          provider: dexProvider,
          rate: undefined,
          rateId: undefined,
          toAmount: undefined,
          tradeMethod: "float",
          payoutNetworkFees: undefined,
        });
      }
    });
  }
  return rates;
};

const inferError = (
  apiAmount: BigNumber,
  unitFrom: Unit,
  responseData: {
    amountTo: string;
    minAmountFrom: string;
    maxAmountFrom: string;
    errorCode?: number;
    errorMessage?: string;
  }
): Error | CustomMinOrMaxError | undefined => {
  const tenPowMagnitude = new BigNumber(10).pow(unitFrom.magnitude);
  const { amountTo, minAmountFrom, maxAmountFrom, errorCode, errorMessage } =
    responseData;

  if (!amountTo) {
    // We are in an error case regardless of api version.
    if (errorCode) {
      return getSwapAPIError(errorCode, errorMessage);
    }

    // For out of range errors we will have a min/max pairing
    const hasAmountLimit = minAmountFrom || maxAmountFrom;
    if (hasAmountLimit) {
      const isTooSmall = minAmountFrom
        ? new BigNumber(apiAmount).lte(minAmountFrom)
        : false;

      const MinOrMaxError = isTooSmall
        ? SwapExchangeRateAmountTooLow
        : SwapExchangeRateAmountTooHigh;

      const key: string = isTooSmall
        ? "minAmountFromFormatted"
        : "maxAmountFromFormatted";

      const amount = isTooSmall ? minAmountFrom : maxAmountFrom;

      return new MinOrMaxError(undefined, {
        [key]: formatCurrencyUnit(
          unitFrom,
          new BigNumber(amount).times(tenPowMagnitude),
          {
            alwaysShowSign: false,
            disableRounding: true,
            showCode: true,
          }
        ),
        amount: new BigNumber(amount),
      });
    }
  }
  return;
};

export default getExchangeRates;
