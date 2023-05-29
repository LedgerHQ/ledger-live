import BigNumber from "bignumber.js";
import {
  Account,
  Operation,
  SubAccount,
  TokenAccount,
} from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  DerivationMode,
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import {
  decodeAccountId,
  decodeTokenAccountId,
  encodeTokenAccountId,
  shortAddressPreview,
} from "../../account";
import { encodeOperationId } from "../../operation";

export const makeAccount = (
  address: string,
  currency: CryptoCurrency,
  subAccounts: SubAccount[] = []
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
    name:
      currency.name +
      " " +
      (derivationMode || "legacy") +
      " " +
      shortAddressPreview(xpubOrAddress),
    xpub: xpubOrAddress,
    subAccounts,
    seedIdentifier: xpubOrAddress,
    starred: true,
    used: true,
    swapHistory: [],
    id,
    derivationMode,
    currency,
    unit: currency.units[0],
    index,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    freshAddresses: [],
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

  return account;
};

export const makeTokenAccount = (
  address: string,
  tokenCurrency: TokenCurrency
): TokenAccount => {
  const { parentCurrency: currency } = tokenCurrency;
  const account = makeAccount(address, currency);

  const tokenAccountId = encodeTokenAccountId(account.id, tokenCurrency);

  return {
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
    starred: false,
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
  };
};

export const makeOperation = (partialOp?: Partial<Operation>): Operation => {
  const accountId = partialOp?.accountId ?? "js:2:ethereum:0xkvn:";
  const { xpubOrAddress } = decodeAccountId(
    accountId.includes("+")
      ? decodeTokenAccountId(accountId).accountId
      : accountId
  );
  const hash = partialOp?.hash ?? "0xhash";
  const type = partialOp?.type ?? "OUT";
  return {
    id: encodeOperationId(accountId, hash, type),
    hash,
    type,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    blockHash: null,
    blockHeight: null,
    senders: [xpubOrAddress],
    recipients: ["0xlmb"],
    accountId,
    transactionSequenceNumber: 0,
    date: new Date(),
    extra: {},
    ...partialOp,
  };
};
