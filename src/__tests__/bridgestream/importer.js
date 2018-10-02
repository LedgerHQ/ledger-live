// @flow
import { makeChunks } from "../../bridgestream/exporter";
import shuffle from "lodash/shuffle"
import {
  parseChunksReducer,
  areChunksComplete,
  chunksToResult
} from "../../bridgestream/importer";
import { genAccount } from "../../mock/account";

test("import", () => {
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
  const chunks = makeChunks(arg);

  let data = [];
  shuffle(chunks).forEach((chunk, i) => {
    expect(areChunksComplete(data)).toBe(false);
    data = parseChunksReducer(data, chunk, console);
    expect(data.length).toBe(i + 1);
    data = parseChunksReducer(data, chunk, console);
    expect(data.length).toBe(i + 1); // chunk already existed
  });
  expect(areChunksComplete(data)).toBe(true);
  const res = chunksToResult(data);
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
