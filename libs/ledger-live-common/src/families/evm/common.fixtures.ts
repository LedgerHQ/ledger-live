// TODO: temporary duplicate of the makeAccount/makeTokenAccount builders still living in coin-evm
// (which excludes fixtures from its build, so they can't be imported here). This is the future
// canonical home: drop coin-evm's copy once its remaining consumers are outsourced to
// ledger-live-common.
import {
  decodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, DerivationMode, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export const makeAccount = (
  address: string,
  currency: CryptoCurrency,
  subAccounts: TokenAccount[] = [],
): Account => {
  const id = `js:2:${currency.id}:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({
    derivationMode: derivationMode as DerivationMode,
    currency,
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  const account: Account = {
    type: "Account",
    xpub: xpubOrAddress,
    subAccounts,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    id,
    derivationMode,
    currency,
    index,
    nfts: [],
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
  };

  return Object.freeze(account);
};

export const makeTokenAccount = (address: string, tokenCurrency: TokenCurrency): TokenAccount => {
  const currency = getCryptoCurrencyById(tokenCurrency.parentCurrencyId);
  const account = makeAccount(address, currency);

  const tokenAccountId = encodeTokenAccountId(account.id, tokenCurrency);

  return Object.freeze({
    type: "TokenAccount",
    id: tokenAccountId,
    parentId: account.id,
    token: tokenCurrency,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
    swapHistory: [],
  });
};
