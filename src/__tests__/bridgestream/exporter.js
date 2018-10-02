// @flow
import { makeChunks } from "../../bridgestream/exporter";
import { genAccount } from "../../mock/account";

test("basic export", () => {
  const accounts = Array(3)
    .fill(null)
    .map((_, i) => genAccount("export_" + i));
  const arg = {
    accounts,
    exporterName: "test",
    exporterVersion: "0.0.0",
    chunkSize: 100
  };
  const chunks = makeChunks(arg);
  expect(chunks).toMatchSnapshot();
});
