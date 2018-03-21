// @flow
import {getBalanceHistory, getBalanceHistorySum} from "../../helpers/account";
import {genAccount} from "../../mock/account";

test("getBalanceHistory(*,7) returns an array of 7 items", () => {
  expect(getBalanceHistory(genAccount(0), 7).length).toBe(7);
});
