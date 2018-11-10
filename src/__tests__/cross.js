// @flow

import flatMap from "lodash/flatMap";
import { genAccount } from "../mock/account";
import { getDerivationModesForCurrency } from "../derivation";
import { listCryptoCurrencies } from "../currencies";
import {
  accountDataToAccount,
  accountToAccountData,
  encode,
  decode
} from "../cross";

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

test("encode/decode", () => {
  const accounts = listCryptoCurrencies().reduce(
    (acc, currency) =>
      acc.concat(
        getDerivationModesForCurrency(currency).map(derivationMode => {
          const account = genAccount(`${currency.id}_${derivationMode}`, {
            currency
          });
          return account;
        })
      ),
    []
  );

  const data = {
    accounts,
    settings: {
      currenciesSettings: {}
    },
    exporterName: "test你好👋",
    exporterVersion: "0.0.0"
  };
  const exp = decode(encode(data));
  expect(exp.meta.exporterName).toEqual(data.exporterName);
  expect(exp.accounts.length).toEqual(data.accounts.length);
  expect(exp.accounts).toMatchObject(data.accounts.map(accountToAccountData));
});
