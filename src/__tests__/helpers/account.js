// @flow
import {getBalanceHistory, getBalanceHistorySum} from "../../helpers/account";
import {genAccount} from "../../mock/account";

test("getBalanceHistory(*,7) returns an array of 7 items", () => {
  const history = getBalanceHistory(genAccount(0, "seed_1"), 30);
  expect(history).toBeInstanceOf(Array);
  expect(history.length).toBe(30);
  expect(history).toMatchSnapshot();
});
