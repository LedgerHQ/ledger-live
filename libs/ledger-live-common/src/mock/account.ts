import Prando from "prando";
import { BigNumber } from "bignumber.js";
import {
  listCryptoCurrencies,
  listTokensForCryptoCurrency,
  findCompoundToken,
} from "../currencies";
import type {
  TokenAccount,
  Account,
  AccountLike,
  Operation,
  CryptoCurrency,
  TokenCurrency,
} from "../types";
import { getOperationAmountNumber } from "../operation";
import {
  inferSubOperations,
  isAccountEmpty,
  emptyHistoryCache,
  generateHistoryFromOperations,
} from "../account";
import { getDerivationScheme, runDerivationScheme } from "../derivation";
import { genHex, genAddress } from "./helpers";
import perFamilyMock from "../generated/mock";

function ensureNoNegative(operations) {
  let total = new BigNumber(0);

  for (let i = operations.length - 1; i >= 0; i--) {
    const op = operations[i];
    const amount = getOperationAmountNumber(op);

    if (total.plus(amount).isNegative()) {
      if (op.type === "IN") {
        op.type = "OUT";
      } else if (op.type === "OUT") {
        op.type = "IN";
      }
    }

    total = total.plus(getOperationAmountNumber(op));
  }

  return total;
}

// for the mock generation we need to adjust to the actual market price of things, we want to avoid having things < 0.01 EUR
const tickerApproxMarketPrice = {
  BTC: 0.0073059,
  ETH: 5.7033e-14,
  ETC: 1.4857e-15,
  BCH: 0.0011739,
  BTG: 0.00005004,
  LTC: 0.00011728,
  XRP: 0.000057633,
  DOGE: 4.9e-9,
  DASH: 0.0003367,
  PPC: 0.000226,
  ZEC: 0.000205798,
};
// mock only use subset of cryptocurrencies to not affect tests when adding coins
const currencies = listCryptoCurrencies().filter(
  (c) => tickerApproxMarketPrice[c.ticker]
);
// TODO fix the mock to never generate negative balance...

/**
 * @memberof mock/account
 */
export function genOperation(
  superAccount: Account,
  account: AccountLike,
  ops: any,
  rng: Prando
): Operation {
  const ticker =
    account.type === "TokenAccount"
      ? account.token.ticker
      : account.currency.ticker;
  const lastOp = ops[ops.length - 1];
  const date = new Date(
    (lastOp ? lastOp.date : Date.now()) -
      rng.nextInt(0, 100000000 * rng.next() * rng.next())
  );
  const address = genAddress(superAccount.currency, rng);
  const type = rng.next() < 0.3 ? "OUT" : "IN";
  const value = new BigNumber(
    Math.floor(
      rng.nextInt(0, 100000 * rng.next() * rng.next()) /
        (tickerApproxMarketPrice[ticker] || tickerApproxMarketPrice.BTC)
    )
  );

  if (Number.isNaN(value)) {
    throw new Error("invalid amount generated for " + ticker);
  }

  const hash = genHex(64, rng);
  const op: Operation = {
    id: String(`mock_op_${ops.length}_${account.id}`),
    hash,
    type,
    value,
    fee: new BigNumber(Math.round(value.toNumber() * 0.01)),
    senders: [type !== "IN" ? genAddress(superAccount.currency, rng) : address],
    recipients: [
      type === "IN" ? genAddress(superAccount.currency, rng) : address,
    ],
    blockHash: genHex(64, rng),
    blockHeight:
      superAccount.blockHeight -
      Math.floor((Date.now() - (date as any)) / 900000),
    accountId: account.id,
    date,
    extra: {},
  };

  if (account.type === "Account") {
    const { subAccounts } = account;

    if (subAccounts) {
      // TODO make sure tokenAccounts sometimes reuse an existing op hash from main account
      op.subOperations = inferSubOperations(hash, subAccounts);
    }
  }

  return op;
}

/**
 * @memberof mock/account
 */
export function genAddingOperationsInAccount(
  account: Account,
  count: number,
  seed: number | string
): Account {
  const rng = new Prando(seed);
  const copy: Account = { ...account };
  copy.operations = Array(count)
    .fill(null)
    .reduce((ops) => {
      const op = genOperation(copy, copy, ops, rng);
      return ops.concat(op);
    }, copy.operations);
  copy.spendableBalance = copy.balance = ensureNoNegative(copy.operations);
  const perFamilyOperation = perFamilyMock[account.currency.id];
  const postSyncAccount =
    perFamilyOperation && perFamilyOperation.postSyncAccount;
  if (postSyncAccount) postSyncAccount(copy);
  return copy;
}

/**
 * @param id is a number or a string, used as an account identifier and as a seed for the generation.
 * @memberof mock/account
 */
export type GenAccountOptions = {
  operationsSize?: number;
  currency?: CryptoCurrency;
  subAccountsCount?: number;
  swapHistorySize?: number;
};

export function genTokenAccount(
  index: number,
  account: Account,
  token: TokenCurrency
): TokenAccount {
  const rng = new Prando(account.id + "|" + index);
  const tokenAccount: TokenAccount = {
    type: "TokenAccount",
    starred: false,
    id: account.id + "|" + index,
    parentId: account.id,
    token,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    swapHistory: [],
    balanceHistoryCache: emptyHistoryCache,
  };
  const operationsSize = rng.nextInt(1, 200);
  tokenAccount.operations = Array(operationsSize)
    .fill(null)
    .reduce((ops: Operation[]) => {
      const op = genOperation(account, tokenAccount, ops, rng);
      return ops.concat(op);
    }, []);
  tokenAccount.operationsCount = tokenAccount.operations.length;
  tokenAccount.spendableBalance = tokenAccount.balance = ensureNoNegative(
    tokenAccount.operations
  );
  tokenAccount.creationDate =
    tokenAccount.operations.length > 0
      ? tokenAccount.operations[tokenAccount.operations.length - 1].date
      : new Date();
  tokenAccount.balanceHistoryCache =
    generateHistoryFromOperations(tokenAccount);
  return tokenAccount;
}

export function genAccount(
  id: number | string,
  opts: GenAccountOptions = {}
): Account {
  const rng = new Prando(id);
  const currency = opts.currency || rng.nextArrayItem(currencies);
  const operationsSize = opts.operationsSize ?? rng.nextInt(1, 200);
  const swapHistorySize = opts.swapHistorySize || 0;
  const address = genAddress(currency, rng);
  const derivationPath = runDerivationScheme(
    getDerivationScheme({
      currency,
      derivationMode: "",
    }),
    currency
  );
  const freshAddress = {
    address,
    derivationPath,
  };
  // nb Make the third (ethereum_classic, dogecoin) account originally migratable
  const outdated =
    ["ethereum_classic", "dogecoin"].includes(currency.id) &&
    `${id}`.endsWith("_2");
  const account: Account = {
    type: "Account",
    id: `mock:${outdated ? 0 : 1}:${currency.id}:${id}:`,
    seedIdentifier: "mock",
    derivationMode: "",
    xpub: genHex(64, rng),
    index: 1,
    freshAddress: address,
    freshAddressPath: derivationPath,
    freshAddresses: [freshAddress],
    name: rng.nextString(rng.nextInt(4, 34)),
    starred: false,
    used: false,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    blockHeight: rng.nextInt(100000, 200000),
    currency,
    unit: rng.nextArrayItem(currency.units),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    creationDate: new Date(),
    swapHistory: Array(swapHistorySize)
      .fill(null)
      .map((_, i) => ({
        provider: "changelly",
        swapId: `swap-id-${i}`,
        status: "finished",
        receiverAccountId: "receiver-id",
        operationId: "operation-id",
        tokenId: "token-id",
        fromAmount: new BigNumber("1000"),
        toAmount: new BigNumber("2000"),
      })),
    balanceHistoryCache: emptyHistoryCache,
  };

  if (
    [
      "ethereum",
      "ethereum_ropsten",
      "ethereum_goerli",
      "tron",
      "algorand",
    ].includes(currency.id)
  ) {
    const tokenCount =
      typeof opts.subAccountsCount === "number"
        ? opts.subAccountsCount
        : rng.nextInt(0, 8);
    const all = listTokensForCryptoCurrency(account.currency);
    const compoundReadyTokens = all.filter(findCompoundToken);
    const notCompoundReadyTokens = all.filter((a) => !findCompoundToken(a));
    // favorize the generation of compound tokens
    const tokens = compoundReadyTokens
      .concat(
        // from random index
        notCompoundReadyTokens.slice(
          rng.nextInt(Math.floor(notCompoundReadyTokens.length / 2))
        )
      )
      .slice(0, tokenCount);
    account.subAccounts = tokens.map((token, i) =>
      genTokenAccount(i, account, token)
    );
  }

  if (currency.id === "cosmos") {
    account.cosmosResources = {
      // TODO variation in these
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
      withdrawAddress: address,
    };
  }

  if (currency.family === "bitcoin") {
    account.bitcoinResources = {
      utxos: [],
      walletAccount: undefined,
    };
  }

  if (currency.family === "algorand") {
    account.algorandResources = {
      rewards: new BigNumber(0),
      nbAssets: account.subAccounts?.length ?? 0,
    };
  }

  if (currency.family === "polkadot") {
    account.polkadotResources = {
      stash: null,
      controller: null,
      nonce: 0,
      lockedBalance: new BigNumber(0),
      unlockingBalance: new BigNumber(0),
      unlockedBalance: new BigNumber(0),
      unlockings: [],
      nominations: [],
      numSlashingSpans: 0,
    };
  }

  account.operations = Array(operationsSize)
    .fill(null)
    .reduce((ops: Operation[]) => {
      const op = genOperation(account, account, ops, rng);
      return ops.concat(op);
    }, []);
  account.creationDate =
    account.operations.length > 0
      ? account.operations[account.operations.length - 1].date
      : new Date();
  account.operationsCount = account.operations.length;
  account.spendableBalance = account.balance = ensureNoNegative(
    account.operations
  );
  account.used = !isAccountEmpty(account);
  const perFamilyOperation = perFamilyMock[currency.id];
  const genAccountEnhanceOperations =
    perFamilyOperation && perFamilyOperation.genAccountEnhanceOperations;
  if (genAccountEnhanceOperations) genAccountEnhanceOperations(account, rng);
  account.balanceHistoryCache = generateHistoryFromOperations(account);
  return account;
}
