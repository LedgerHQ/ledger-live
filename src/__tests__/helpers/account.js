// @flow
import flatMap from "lodash/flatMap";
import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById
} from "../../currencies";
import {
  groupAccountOperationsByDay,
  groupAccountsOperationsByDay,
  shortAddressPreview
} from "../../account";
import { genAccount } from "../../mock/account";

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

test("shortAddressPreview", () => {
  expect(
    shortAddressPreview("0x112233445566778899001234567890aAbBcCdDeEfF")
  ).toBe("0x112233...cCdDeEfF");
  expect(
    shortAddressPreview("0x112233445566778899001234567890aAbBcCdDeEfF", 30)
  ).toBe("0x11223344556...0aAbBcCdDeEfF");
});
