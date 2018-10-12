// @flow
import { encode, decode } from "../../cross";
import shuffle from "lodash/shuffle"
import { genAccount } from "../../mock/account";

test("encode/decode", () => {
  const accounts = Array(3)
    .fill(null)
    .map((_, i) => genAccount("export_" + i));
  const arg = {
    accounts,
    settings: {
      counterValue: "USD",
      counterValueExchange: "KRAKEN",
      currenciesSettings: {
        bitcoin: {
          exchange: "KRAKEN",
        }
      }
    },
    exporterName: "test",
    exporterVersion: "0.0.0",
    chunkSize: 100
  };
  const data = encode(arg);
  const res = decode(data);
  expect(res.accounts).toMatchObject(
    accounts.map(a => ({
      balance: a.balance.toString(),
      currencyId: a.currency.id,
      id: a.id,
      name: a.name,
      index: a.index,
    }))
  );
  expect(res.settings).toMatchObject({
    counterValue: "USD",
    counterValueExchange: "KRAKEN",
    currenciesSettings: {
      bitcoin: {
        exchange: "KRAKEN",
      }
    }
  })
  expect(res).toMatchSnapshot();
});
