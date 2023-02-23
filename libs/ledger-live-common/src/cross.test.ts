import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getDerivationModesForCurrency } from "@ledgerhq/coin-framework/derivation";
import { listCryptoCurrencies, setSupportedCurrencies } from "./currencies";
import {
  accountDataToAccount,
  accountToAccountData,
  encode,
  decode,
} from "./cross";
import { Account } from "@ledgerhq/types-live";

setSupportedCurrencies(["ethereum", "ethereum_classic"]);

test("accountDataToAccount / accountToAccountData", () => {
  listCryptoCurrencies().forEach((currency) => {
    getDerivationModesForCurrency(currency).forEach((derivationMode) => {
      const account = genAccount(`${currency.id}_${derivationMode}`, {
        currency,
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
    (acc: Account[], currency) =>
      acc.concat(
        getDerivationModesForCurrency(currency).map((derivationMode) => {
          const account = genAccount(`${currency.id}_${derivationMode}`, {
            currency,
          });
          return account;
        })
      ),
    <Account[]>[]
  );
  const data = {
    accounts,
    settings: {
      currenciesSettings: {},
      pairExchanges: {},
    },
    exporterName: "test你好👋",
    exporterVersion: "0.0.0",
  };
  const exp = decode(encode(data));
  expect(exp.meta.exporterName).toEqual(data.exporterName);
  expect(exp.accounts.length).toEqual(data.accounts.length);
  expect(exp.accounts).toMatchObject(data.accounts.map(accountToAccountData));
});
test("encode/decode", () => {
  const accounts = Array(3)
    .fill(null)
    .map((_, i) => genAccount("export_" + i));
  const arg = {
    accounts,
    settings: {
      counterValue: "USD",
      pairExchanges: {
        BTC_USD: "KRAKEN",
      },
      currenciesSettings: {
        bitcoin: {
          confirmationsNb: 3,
        },
      },
      blacklistedTokenIds: ["tokenid1", "tokenid2"],
    },
    exporterName: "test",
    exporterVersion: "0.0.0",
    chunkSize: 100,
  };
  const data = encode(arg);
  const res = decode(data);
  expect(res.accounts).toMatchObject(
    accounts.map((a) => ({
      balance: a.balance.toString(),
      currencyId: a.currency.id,
      id: a.id,
      name: a.name,
      index: a.index,
    }))
  );
  expect(res.settings).toMatchObject({
    counterValue: "USD",
    pairExchanges: {
      BTC_USD: "KRAKEN",
    },
    currenciesSettings: {
      bitcoin: {
        confirmationsNb: 3,
      },
    },
    blacklistedTokenIds: ["tokenid1", "tokenid2"],
  });
  expect(res.settings).not.toMatchObject({
    counterValue: "USD",
    pairExchanges: {
      BTC_USD: "KRAKEN",
    },
    currenciesSettings: {
      bitcoin: {
        confirmationsNb: 3,
      },
    },
    blacklistedTokenIds: ["tokenid3"],
  });
  expect(res).toMatchSnapshot();
});
