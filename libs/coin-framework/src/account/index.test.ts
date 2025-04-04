import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets/index";
import { Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import {
  accountWithMandatoryTokens,
  groupAccountOperationsByDay,
  groupAccountsOperationsByDay,
  shortAddressPreview,
} from ".";
import { setSupportedCurrencies } from "../currencies";
import { genAccount } from "../mocks/account";
import "../test-helpers/staticTime";

setSupportedCurrencies(["ethereum", "ethereum_classic", "tron"]);

describe("groupAccountOperationsByDay", () => {
  test("basic", () => {
    const account = genAccount("seed_7", {
      currency: getCryptoCurrencyById("zcash"),
      operationsSize: 20,
    });
    const res1 = groupAccountOperationsByDay(account, {
      count: 10,
    });
    expect(res1.completed).toBe(false);
    expect(res1).toMatchSnapshot();
    const res2 = groupAccountOperationsByDay(account, {
      count: Infinity,
    });
    expect(res2.completed).toBe(true);
    expect(
      // $FlowFixMe
      flatMap(res2.sections, s => s.data).slice(0, 10),
    ).toMatchObject(
      // $FlowFixMe
      flatMap(res1.sections, s => s.data),
    );
    const res3 = groupAccountOperationsByDay(account, {
      count: 20,
    });
    expect(res3.completed).toBe(true);
    const res4 = groupAccountOperationsByDay(account, {
      count: 16,
    });
    expect(res4.completed).toBe(false);
  });
  test("basic 2", () => {
    const accounts = Array(10)
      .fill(null)
      .map((_, i) => genAccount("gaobd" + i));
    const res1 = groupAccountsOperationsByDay(accounts, {
      count: 100,
    });
    expect(res1.completed).toBe(false);
    expect(res1).toMatchSnapshot();
    const res2 = groupAccountsOperationsByDay(accounts, {
      count: Infinity,
    });
    expect(res2.completed).toBe(true);
    expect(
      // $FlowFixMe
      flatMap(res2.sections, s => s.data).slice(0, 100),
    ).toMatchObject(
      // $FlowFixMe
      flatMap(res1.sections, s => s.data),
    );
  });
  test("filterOperation", () => {
    const account = genAccount("seed_7");
    account.pendingOperations = account.operations.splice(0, 2);
    const res1 = groupAccountOperationsByDay(account, {
      count: 10,
      filterOperation: () => false,
    });
    expect(res1.sections.length).toBe(0);
    expect(res1.completed).toBe(true);
    const res2 = groupAccountOperationsByDay(account, {
      count: 10,
      filterOperation: () => true,
    });
    expect(res2).toEqual(
      groupAccountOperationsByDay(account, {
        count: 10,
      }),
    );
    const res3 = groupAccountOperationsByDay(account, {
      count: 10,
      filterOperation: (op, acc) => {
        expect(acc).toBe(account);
        return op.type === "OUT";
      },
    });
    expect(res3).toEqual(
      groupAccountOperationsByDay(
        {
          ...account,
          operations: account.operations.filter(op => op.type === "OUT"),
          pendingOperations: account.pendingOperations.filter(op => op.type === "OUT"),
        },
        {
          count: 10,
        },
      ),
    );
  });
  test("provide at least the requested count even if some op yield nothing", () => {
    const ethAccount = genAccount("eth_1", {
      currency: getCryptoCurrencyById("ethereum"),
      operationsSize: 300,
    });
    ethAccount.operations = Array(50)
      .fill({
        ...ethAccount.operations[0],
        value: new BigNumber(0),
        type: "NONE",
      })
      .concat(ethAccount.operations);
    const res1 = groupAccountOperationsByDay(ethAccount, {
      count: 100,
    });
    expect(res1.completed).toBe(false);
    expect(
      res1.sections.reduce((acc, s) => acc.concat(s.data), <Operation[]>[]).length,
    ).toBeGreaterThanOrEqual(100);
  });
  test("to dedup", () => {
    const account = genAccount("seed_8");
    account.pendingOperations = account.operations.slice(0, 3);
    const accountClone = genAccount("seed_8");
    const res1 = groupAccountOperationsByDay(account, {
      count: 100,
    });
    const res2 = groupAccountOperationsByDay(accountClone, {
      count: 100,
    });
    expect(res1).toMatchObject(res2);
  });
});
test("shortAddressPreview", () => {
  expect(shortAddressPreview("0x112233445566778899001234567890aAbBcCdDeEfF")).toBe(
    "0x112233...cCdDeEfF",
  );
  expect(shortAddressPreview("0x112233445566778899001234567890aAbBcCdDeEfF", 30)).toBe(
    "0x11223344556...0aAbBcCdDeEfF",
  );
});
test("accountWithMandatoryTokens ethereum", () => {
  const currency = getCryptoCurrencyById("ethereum");
  const account = genAccount("", {
    currency,
    subAccountsCount: 5,
  });
  const enhance = accountWithMandatoryTokens(account, [getTokenById("ethereum/erc20/0x_project")]);
  const doubleEnhance = accountWithMandatoryTokens(enhance, [
    getTokenById("ethereum/erc20/0x_project"),
  ]);
  expect(doubleEnhance).toEqual(enhance);
  expect({ ...enhance, subAccounts: [] }).toMatchObject({
    ...account,
    subAccounts: [],
  });
  expect((enhance.subAccounts || []).map(a => a.id)).toMatchSnapshot();
});
