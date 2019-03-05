// @flow

import { genAccount } from "../mock/account";
import { listCryptoCurrencies } from "../currencies";
import { accountsOpToCSV } from "../csvExport";

test("export CSV", () => {
  expect(
    accountsOpToCSV(
      listCryptoCurrencies().map(currency =>
        genAccount(`${currency.id}_export`)
      )
    )
  ).toMatchSnapshot();
});
