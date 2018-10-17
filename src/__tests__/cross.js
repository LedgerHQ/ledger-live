// @flow

import flatMap from "lodash/flatMap";
import { genAccount } from "../mock/account";
import { getDerivationModesForCurrency } from "../derivation";
import { listCryptoCurrencies } from "../currencies";
import { accountDataToAccount, accountToAccountData } from "../cross";

test("accountDataToAccount / accountToAccountData", () => {
  listCryptoCurrencies().forEach(currency => {
    getDerivationModesForCurrency(currency).forEach(derivationMode => {
      const account = genAccount(`${currency.id}_${derivationMode}`, {
        currency
      });
      const data = accountToAccountData(account);
      expect(accountToAccountData(accountDataToAccount(data))).toMatchObject(
        data
      );
    });
  });
});
