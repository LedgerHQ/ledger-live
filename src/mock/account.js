/**
 * @module mock/account
 * @flow
 */
import { listCryptoCurrencies } from "../helpers/currencies";
import Prando from "prando";
import type { Account, Operation, CryptoCurrency } from "../types";

const currencies = listCryptoCurrencies();

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
  ZEC: 0.000205798
};

/**
 * @memberof mock/account
 */
export function genBitcoinAddressLike(rng: Prando) {
  const charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return `1${rng.nextString(rng.nextInt(25, 34), charset)}`;
}

/**
 * @memberof mock/account
 */
export function genHex(length: number, rng: Prando) {
  return rng.nextString(length, "0123456789ABCDEF");
}

/**
 * @memberof mock/account
 */
export function genAddress(currency: CryptoCurrency, rng: Prando) {
  if (currency.id === "ethereum" || currency.id === "ethereum_classic") {
    return `0x${genHex(40, rng)}`;
  }
  return genBitcoinAddressLike(rng);
}

// TODO fix the mock to never generate negative balance...
/**
 * @memberof mock/account
 */
export function genOperation(
  account: Account,
  ops: *,
  currency: CryptoCurrency,
  rng: Prando
): Operation {
  const lastOp = ops[ops.length - 1];
  const date = new Date(
    (lastOp ? lastOp.date : Date.now()) -
      rng.nextInt(0, 100000000 * rng.next() * rng.next())
  );
  const address = genAddress(currency, rng);
  const amount =
    (rng.next() < 0.3 ? -1 : 1) *
    Math.floor(
      rng.nextInt(0, 100000 * rng.next() * rng.next()) /
        (tickerApproxMarketPrice[currency.ticker] ||
          tickerApproxMarketPrice.BTC)
    );
  if (isNaN(amount)) {
    throw new Error("invalid amount generated for " + currency.id);
  }
  return {
    id: String(`mock_op_${ops.length}_${account.id}`),
    confirmations: 0,
    accountId: account.id,
    address,
    addresses: [address],
    senders: [address],
    recipients: [address],
    amount,
    hash: genHex(64, rng),
    date,
    blockHash: genHex(64, rng),
    blockHeight: account.blockHeight - Math.floor((Date.now() - date) / 900000)
  };
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
    .reduce(ops => {
      const op = genOperation(copy, ops, copy.currency, rng);
      return ops.concat(op);
    }, copy.operations);
  copy.balance = ensureNoNegative(copy.operations);
  return copy;
}

/**
 * @param id is a number or a string, used as an account identifier and as a seed for the generation.
 * @memberof mock/account
 */
type GenAccountOptions = {
  operationsSize?: number,
  currency?: CryptoCurrency
};

export function genAccount(
  id: number | string,
  opts: GenAccountOptions = {}
): Account {
  const rng = new Prando(id);
  const currency = opts.currency || rng.nextArrayItem(currencies);
  const operationsSize = opts.operationsSize || rng.nextInt(1, 200);
  const address = genAddress(currency, rng);
  const account = {
    id: `mock_account_${id}`,
    isSegwit: true,
    index: 0,
    path: "49'/1'/1'/0/2",
    walletPath: "49'/1'/1'",
    xpub: genHex(64, rng),
    archived: false,
    currency,
    blockHeight: rng.nextInt(100000, 200000),
    lastSyncDate: new Date(),
    unit: rng.nextArrayItem(currency.units),
    balance: 0,
    address,
    addresses: [{ str: address, path: "49'/1'/1'/1" }],
    operations: [],
    operationsSize,
    minConfirmations: 2,
    name: rng.nextString(rng.nextInt(4, 34))
  };

  account.operations = Array(operationsSize)
    .fill(null)
    .reduce(ops => {
      const op = genOperation(account, ops, currency, rng);
      return ops.concat(op);
    }, []);

  account.balance = ensureNoNegative(account.operations);
  return account;
}

function ensureNoNegative(operations) {
  // NB impl bug because https://twitter.com/greweb/status/997781276546555904
  let total = 0;
  for (let i = operations.length - 1; i >= 0; i--) {
    const op = operations[i];
    if (total + op.amount < 0) {
      op.amount = -op.amount;
    }
    total += op.amount;
  }
  return total;
}
