import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { buildMultiCV } from "@domain/entity-market-countervalues/mock";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";

export const analyticsFiat = getFiatCurrencyByTicker("USD");
const historyDate = new Date(Date.now() - 90 * 86400000);

function confirmedReceive(operation: Operation, value: BigNumber): Operation {
  return {
    ...operation,
    type: "IN",
    value,
    fee: new BigNumber(0),
    date: historyDate,
    blockHeight: 90,
    subOperations: [],
  };
}

export function createAnalyticsAccount(id: string, currencyId = "ethereum", amount = 1): Account {
  const account = genAccount(id, {
    currency: getCryptoCurrencyById(currencyId),
    subAccountsCount: 0,
    operationsSize: 1,
  });
  const balance = new BigNumber(amount).shiftedBy(account.currency.units[0].magnitude);
  return {
    ...account,
    balance,
    spendableBalance: balance,
    blockHeight: 10000,
    creationDate: historyDate,
    balanceHistoryCache: emptyHistoryCache,
    operations: [confirmedReceive(account.operations[0], balance)],
  };
}

export function createAnalyticsToken(parent: Account, amount = 10) {
  const account = genTokenAccount(0, parent, usdcToken);
  const balance = new BigNumber(amount).shiftedBy(usdcToken.units[0].magnitude);
  return {
    ...account,
    balance,
    spendableBalance: balance,
    creationDate: historyDate,
    balanceHistoryCache: emptyHistoryCache,
    operationsCount: 1,
    operations: [confirmedReceive(account.operations[0], balance)],
  };
}

/** Natives are priced 200 and tokens 1, with a 401-day history. */
export function createAnalyticsCountervalues(positions: readonly AccountLike[]) {
  return buildMultiCV(
    positions.map(position => {
      const isToken = position.type === "TokenAccount";
      const history = Object.fromEntries(
        Array.from({ length: 401 }, (_, index) => [
          new Date(Date.now() - index * 86400000).toISOString().slice(0, 10),
          isToken ? 1 : 100,
        ]),
      );
      return {
        pair: { from: isToken ? position.token : position.currency, to: analyticsFiat },
        history,
        latest: isToken ? 1 : 200,
      };
    }),
  );
}
