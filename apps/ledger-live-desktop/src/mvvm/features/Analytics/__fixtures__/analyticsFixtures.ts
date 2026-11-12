import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { buildMultiCV } from "@domain/entity-market-countervalues/mock";
import { makeIntegrationTokenCurrency } from "tests/utils/distributionTestUtils";
import type { Account, AccountLike } from "@ledgerhq/types-live";

export const analyticsFiat = getFiatCurrencyByTicker("USD");
export const analyticsHistoryDate = new Date(Date.now() - 90 * 86400000);

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
    creationDate: analyticsHistoryDate,
    balanceHistoryCache: emptyHistoryCache,
    operations: [
      {
        ...account.operations[0],
        type: "IN",
        value: balance,
        fee: new BigNumber(0),
        date: analyticsHistoryDate,
        blockHeight: 90,
        subOperations: [],
      },
    ],
  };
}

export function createAnalyticsToken(parent: Account, amount = 10) {
  const token = makeIntegrationTokenCurrency("ethereum/erc20/usd__coin", "USDC", "USD Coin");
  const account = genTokenAccount(0, parent, token);
  const balance = new BigNumber(amount).shiftedBy(token.units[0].magnitude);
  return {
    ...account,
    balance,
    spendableBalance: balance,
    creationDate: analyticsHistoryDate,
    balanceHistoryCache: emptyHistoryCache,
    operationsCount: 1,
    operations: [
      {
        ...account.operations[0],
        type: "IN" as const,
        value: balance,
        fee: new BigNumber(0),
        date: analyticsHistoryDate,
        blockHeight: 90,
        subOperations: [],
      },
    ],
  };
}

export function createAnalyticsCountervalues(positions: readonly AccountLike[]) {
  return buildMultiCV(
    positions.map(position => {
      const currency = position.type === "Account" ? position.currency : position.token;
      const isToken = position.type === "TokenAccount";
      const history = Object.fromEntries(
        Array.from({ length: 401 }, (_, index) => [
          new Date(Date.now() - index * 86400000).toISOString().slice(0, 10),
          isToken ? 1 : 100,
        ]),
      );
      return { pair: { from: currency, to: analyticsFiat }, history, latest: isToken ? 1 : 200 };
    }),
  );
}
