// @flow
import { getFiatUnit } from "@ledgerhq/currencies";
import { getBalanceHistory, getBalanceHistorySum, groupAccountOperationsByDay } from "../../helpers/account";
import { genAccount } from "../../mock/account";

test("getBalanceHistory(*,30) returns an array of 30 items", () => {
  const history = getBalanceHistory(genAccount("seed_1"), 30);
  expect(history).toBeInstanceOf(Array);
  expect(history.length).toBe(30);
  expect(history).toMatchSnapshot();
});

test("getBalanceHistory(*,365) works as well", () => {
  const history = getBalanceHistory(genAccount("seed_2"), 256);
  expect(history[history.length - 1].date);
  expect(history).toMatchSnapshot();
});

test("getBalanceHistory last item is now and have an amount equals to account balance", () => {
  const account = genAccount("seed_3");
  const history = getBalanceHistory(account, 50);
  expect(history[history.length - 1].date).toMatchObject(new Date());
  expect(history[history.length - 1].value).toBe(account.balance);
  expect(history).toMatchSnapshot();
});

test("getBalanceHistorySum works with one account and is identically to that account history", () => {
  const account = genAccount("seed_4");
  const history = getBalanceHistory(account, 10);
  const allHistory = getBalanceHistorySum(
    [account],
    10,
    getFiatUnit("USD"),
    () => value => value // using identity, at any time, 1 token = 1 USD
  );
  expect(allHistory).toMatchObject(history);
  expect(allHistory).toMatchSnapshot();
});

test("getBalanceHistorySum with twice same account will double the amounts", () => {
  const account = genAccount("seed_5");
  const history = getBalanceHistory(account, 10);
  const allHistory = getBalanceHistorySum(
    [account, account],
    10,
    getFiatUnit("USD"),
    () => value => value // using identity, at any time, 1 token = 1 USD
  );
  allHistory.forEach((h, i) => {
    expect(h.value).toBe(2 * history[i].value);
  });
});

test("getBalanceHistorySum calculateCounterValue is taken into account", () => {
  const account = genAccount("seed_6");
  const history = getBalanceHistory(account, 10);
  const allHistory = getBalanceHistorySum(
    [account, account],
    10,
    getFiatUnit("USD"),
    () => value => value / 2
  );
  expect(allHistory).toMatchObject(history);
});

test("getBalanceHistorySum with lot of accounts", () => {
  const allHistory = getBalanceHistorySum(
    Array(60)
      .fill(null)
      .map((_, i) => genAccount("mult" + i)),
    10,
    getFiatUnit("USD"),
    () => value => value // using identity, at any time, 1 token = 1 USD
  );
  expect(allHistory).toMatchSnapshot();
});

test("groupAccountOperationsByDay", () => {
  const account = genAccount("seed_7");
  expect(groupAccountOperationsByDay(account, 100)).toMatchSnapshot();
});

// TODO testing calculateCounterValue is correctly called for picking diff coins/dates.
