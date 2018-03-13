// @flow
import { listCurrencies } from "@ledgerhq/currencies";
import type { Currency } from "@ledgerhq/currencies";
import type { Account } from "../types/common";

const currencies = listCurrencies();

export function genBalanceDataNext(data: *, dateIncrement: number) {
  function mix(a, b, m) {
    return (1 - m) * a + m * b;
  }
  return {
    date: new Date(data[data.length - 1].date.getTime() + dateIncrement),
    value: mix(
      data[data.length - 1].value,
      Math.floor(6000000 * Math.random()),
      0.5
    )
  };
}

export function genBalanceData(n: number, dateIncrement: number) {
  const arr = [{ date: new Date(2018, 2, 1), value: 1234567 }];
  for (let i = 1; i < n; i++) {
    arr.push(genBalanceDataNext(arr, dateIncrement));
  }
  return arr;
}

export function genBitcoinAddressLike() {
  const charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return `1${Array(Math.floor(25 + 9 * Math.random()))
    .fill(null)
    .map(() => charset[Math.floor(Math.random() * charset.length)])
    .join("")}`;
}

export function genHex(length: number) {
  return Array(length)
    .fill(null)
    .map(() => Math.floor(16 * Math.random()).toString(16))
    .join("");
}

export function genAddress(currency: Currency) {
  if (currency.coinType === 60 || currency.coinType === 61) {
    return `0x${genHex(40)}`;
  }
  return genBitcoinAddressLike();
}

// TODO fix the mock to never generate negative balance...

export function genOperation(account: Account, ops: *, currency: Currency) {
  const lastOp = ops[ops.length - 1];
  const receivedAt = new Date(
    lastOp
      ? new Date(lastOp.receivedAt) -
        Math.floor(100000000 * Math.random() * Math.random())
      : Date.now() - Math.floor(1000000000 * Math.random() * Math.random())
  ).toUTCString();
  return {
    id: String(`mock_op_${ops.length}_${account.id}`),
    account,
    address: genAddress(currency),
    amount:
      (Math.random() < 0.3 ? -1 : 1) *
      Math.floor(1000000000 * Math.random() * Math.random()),
    hash: genHex(64),
    receivedAt,
    confirmations: Math.floor((Date.now() - new Date(receivedAt)) / 900000)
  };
}

export function genAccount(accountIndex: number) {
  const currency = currencies[Math.floor(currencies.length * Math.random())];
  const account: Account = {
    id: String(`mock_account_${accountIndex}`),
    archived: false,
    data: genBalanceData(8, 86400000),
    currency,
    coinType: currency.coinType,
    unitIndex: 0,
    balance: 0,
    address: genAddress(currency),
    operations: [],
    name:
      String.fromCharCode(Math.floor(65 + 26 * Math.random())) +
      Array(Math.floor(4 + 30 * Math.random()))
        .fill("")
        .map(() => String.fromCharCode(Math.floor(65 + 26 * Math.random())))
        .join("")
        .toLowerCase()
  };
  account.operations = Array(Math.floor(1 + 200 * Math.random()))
    .fill(null)
    .reduce(ops => {
      const op = genOperation(account, ops, currency);
      return ops.concat(op);
    }, []);
  account.balance = account.operations.reduce((sum, op) => sum + op.amount, 0);
  return account;
}
