// @flow

import "./test-helpers/staticTime";

import { genAccount } from "../mock/account";
import { getCryptoCurrencyById } from "../currencies";
import { accountsOpToCSV } from "../csvExport";

test("export CSV", () => {
  expect(
    accountsOpToCSV(
      [
        getCryptoCurrencyById("bitcoin"),
        getCryptoCurrencyById("ethereum"),
        getCryptoCurrencyById("ripple"),
      ].map((currency) => genAccount(`${currency.id}_export`))
    )
  ).toMatchSnapshot();
});
