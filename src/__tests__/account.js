// @flow
import "./test-helpers/staticTime";
import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import { getCryptoCurrencyById, getTokenById } from "../currencies";
import {
  groupAccountOperationsByDay,
  groupAccountsOperationsByDay,
  shortAddressPreview,
  accountWithMandatoryTokens,
  withoutToken
} from "../account";
import { genAccount } from "../mock/account";

import "../load/tokens/ethereum/erc20";
import "../load/tokens/tron/trc10";
import "../load/tokens/tron/trc20";

test("groupAccountOperationsByDay", () => {
  const account = genAccount("seed_7");
  const res1 = groupAccountOperationsByDay(account, { count: 10 });
  expect(res1.completed).toBe(false);
  expect(res1).toMatchSnapshot();
  const res2 = groupAccountOperationsByDay(account, { count: Infinity });
  expect(res2.completed).toBe(true);
  expect(
    // $FlowFixMe
    flatMap(res2.sections, s => s.data).slice(0, 10)
  ).toMatchObject(
    // $FlowFixMe
    flatMap(res1.sections, s => s.data)
  );
});

test("groupAccountsOperationsByDay", () => {
  const accounts = Array(10)
    .fill(null)
    .map((_, i) => genAccount("gaobd" + i));
  const res1 = groupAccountsOperationsByDay(accounts, { count: 100 });
  expect(res1.completed).toBe(false);
  expect(res1).toMatchSnapshot();
  const res2 = groupAccountsOperationsByDay(accounts, { count: Infinity });
  expect(res2.completed).toBe(true);
  expect(
    // $FlowFixMe
    flatMap(res2.sections, s => s.data).slice(0, 100)
  ).toMatchObject(
    // $FlowFixMe
    flatMap(res1.sections, s => s.data)
  );
});

test("groupAccountsOperationsByDay provide at least the requested count even if some op yield nothing", () => {
  const ethAccount = genAccount("eth_1", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 300
  });
  ethAccount.operations = Array(50)
    .fill({
      ...ethAccount.operations[0],
      value: BigNumber(0),
      type: "NONE"
    })
    .concat(ethAccount.operations);

  const res1 = groupAccountOperationsByDay(ethAccount, { count: 100 });
  expect(res1.completed).toBe(false);
  expect(
    res1.sections.reduce((acc, s) => acc.concat(s.data), []).length
  ).toBeGreaterThanOrEqual(100);
});

test("shortAddressPreview", () => {
  expect(
    shortAddressPreview("0x112233445566778899001234567890aAbBcCdDeEfF")
  ).toBe("0x112233...cCdDeEfF");
  expect(
    shortAddressPreview("0x112233445566778899001234567890aAbBcCdDeEfF", 30)
  ).toBe("0x11223344556...0aAbBcCdDeEfF");
});

test("groupAccountOperationsByDay to dedup", () => {
  const account = genAccount("seed_8");
  account.pendingOperations = account.operations.slice(0, 3);
  const accountClone = genAccount("seed_8");
  const res1 = groupAccountOperationsByDay(account, { count: 100 });
  const res2 = groupAccountOperationsByDay(accountClone, { count: 100 });
  expect(res1).toMatchObject(res2);
});

test("accountWithMandatoryTokens ethereum", () => {
  const currency = getCryptoCurrencyById("ethereum");
  const account = genAccount("", { currency, subAccountsCount: 5 });
  const enhance = accountWithMandatoryTokens(account, [
    getTokenById("ethereum/erc20/0x_project")
  ]);
  const doubleEnhance = accountWithMandatoryTokens(enhance, [
    getTokenById("ethereum/erc20/0x_project")
  ]);
  expect(doubleEnhance).toEqual(enhance);
  expect({ ...enhance, subAccounts: [] }).toMatchObject({
    ...account,
    subAccounts: []
  });
  expect((enhance.subAccounts || []).map(a => a.id)).toMatchSnapshot();
});

test("withoutToken", () => {
  const isTokenAccount = (account, tokenId) =>
    account.type === "TokenAccount" && account.token.id === tokenId;

  const tokenIds = [
    "ethereum/erc20/0x_project",
    "ethereum/erc20/leo_token",
    "ethereum/erc20/cro",
    "ethereum/erc20/huobitoken"
  ];
  const currency = getCryptoCurrencyById("ethereum");
  const account = genAccount("", { currency, subAccountsCount: 0 });

  //Enhance the account with some tokens
  const enhance = accountWithMandatoryTokens(
    account,
    tokenIds.map(getTokenById)
  );

  //Get a version of that account without all the tokens
  let demote = enhance;
  for (const tokenId of tokenIds) {
    demote = withoutToken(demote, tokenId);
  }

  const saTokens = enhance.subAccounts || [];
  const saNoTokens = demote.subAccounts || [];

  //See if we have added/removed them correctly
  for (const tokenId of tokenIds) {
    expect(saTokens.find(a => isTokenAccount(a, tokenId))).toBeTruthy();
    expect(saNoTokens.find(a => isTokenAccount(a, tokenId))).toBeFalsy();
  }
});
