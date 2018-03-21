// @flow
import { listCurrencies } from "@ledgerhq/currencies";
import Prando from "prando";
import type { Currency } from "@ledgerhq/currencies";
import type { Account, Operation } from "../types";

const currencies = listCurrencies();

export function genBitcoinAddressLike(rng: Prando) {
  const charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return `1${rng.nextString(rng.nextInt(25, 34), charset)}`;
}

export function genHex(length: number, rng: Prando) {
  return rng.nextString(length, "0123456789ABCDEF");
}

export function genAddress(currency: Currency, rng: Prando) {
  if (currency.coinType === 60 || currency.coinType === 61) {
    return `0x${genHex(40, rng)}`;
  }
  return genBitcoinAddressLike(rng);
}

// TODO fix the mock to never generate negative balance...

export function genOperation(
  account: Account,
  ops: *,
  currency: Currency,
  rng: Prando
): Operation {
  const lastOp = ops[ops.length - 1];
  const date = new Date(
    (lastOp ? lastOp.date : Date.now()) -
      rng.nextInt(0, 100000000 * rng.next() * rng.next())
  );
  return {
    id: String(`mock_op_${ops.length}_${account.id}`),
    accountId: account.id,
    address: genAddress(currency, rng),
    amount:
      (rng.next() < 0.3 ? -1 : 1) *
      rng.nextInt(0, 100000000 * rng.next() * rng.next()),
    hash: genHex(64, rng),
    date,
    blockHeight:
      account.lastBlockHeight - Math.floor((Date.now() - date) / 900000)
  };
}

/**
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
  copy.balance = account.operations.reduce((sum, op) => sum + op.amount, 0);
  return copy;
}

/**
 * @param id is a number or a string, used as an account identifier and as a seed for the generation.
 */
export function genAccount(id: number | string) {
  const rng = new Prando(id);
  const currency = rng.nextArrayItem(currencies);
  const account: Account = {
    id: `mock_account_${id}`,
    xpub: genHex(64, rng),
    archived: false,
    currency,
    lastBlockHeight: rng.nextInt(100000, 200000),
    unit: rng.nextArrayItem(currency.units),
    balance: 0,
    address: genAddress(currency, rng),
    operations: [],
    minConfirmations: 2,
    name: rng.nextString(rng.nextInt(4, 34))
  };
  account.operations = Array(rng.nextInt(1, 200))
    .fill(null)
    .reduce(ops => {
      const op = genOperation(account, ops, currency, rng);
      return ops.concat(op);
    }, []);
  account.balance = account.operations.reduce((sum, op) => sum + op.amount, 0);
  return account;
}
