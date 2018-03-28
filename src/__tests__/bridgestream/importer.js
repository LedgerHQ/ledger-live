// @flow
import { getFiatUnit } from "@ledgerhq/currencies";
import { makeChunks } from "../../bridgestream/exporter";
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
    exporterName: "test",
    exporterVersion: "0.0.0"
  };
  const chunks = makeChunks(arg);

  let data = [];
  [1, 2, 0, 3].forEach((nb, i) => {
    expect(areChunksComplete(data)).toBe(false);
    data = parseChunksReducer(data, chunks[nb]);
    expect(data.length).toBe(i + 1);
    data = parseChunksReducer(data, chunks[nb]);
    expect(data.length).toBe(i + 1); // chunk already existed
  });
  expect(areChunksComplete(data)).toBe(true);
  const res = chunksToResult(data);
  // $FlowFixMe
  expect(res.accounts).toMatchObject(
    accounts.map(a => ["account", a.id, a.name, a.currency.coinType])
  );
  expect(res).toMatchSnapshot();
});
