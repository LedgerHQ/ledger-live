// TODO: temporary duplicate of the account builders in coin-evm's fixtures/common.fixtures.ts
// (coin-evm excludes fixtures from its build, so they can't be imported here). Used by
// syncHelpers.test.ts. Remove once a shared fixture source is available to coin modules.
import {
  decodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, DerivationMode, Operation, TokenAccount } from "@ledgerhq/types-live";
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

export const makeOperation = (partialOp?: Partial<Operation>): Operation => {
  const accountId = partialOp?.accountId ?? "js:2:celo:0xcafe:";
  const { xpubOrAddress } = decodeAccountId(
    accountId.includes("+") ? accountId.split("+")[0] : accountId,
  );
  const hash = partialOp?.hash ?? "0xhash";
  const type = partialOp?.type ?? "OUT";

  return Object.freeze({
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
    transactionSequenceNumber: new BigNumber(0),
    date: new Date(),
    nftOperations: [],
    subOperations: [],
    internalOperations: [],
    extra: {},
    ...partialOp,
  });
};
