import assert from "node:assert/strict";
import test from "node:test";
import { parsePerpsArgs } from "./perps";

const ADDRESS = "0x30Fb429E206729962c548b9a8d7E79095cC7E0E2";

test("parsePerpsArgs requires a flow and an address", () => {
  assert.throws(() => parsePerpsArgs(["sweep"]), /Missing --address/);
  assert.throws(() => parsePerpsArgs(["open", "--address", ADDRESS]), /Usage/);
});

test("parsePerpsArgs reads the options", () => {
  assert.deepEqual(
    parsePerpsArgs(["sweep", "--address", ADDRESS, "--dry-run", "--speculos-port", "40001"]),
    {
      flow: "sweep",
      address: ADDRESS,
      account: "HYPERCORE_1",
      dryRun: true,
      speculosApiPort: 40001,
      nanoAppCatalogPath: undefined,
      apiUrl: undefined,
      marketId: undefined,
    },
  );
});

test("parsePerpsArgs never takes a flag as a value", () => {
  assert.throws(
    () => parsePerpsArgs(["sweep", "--address", "--dry-run"]),
    /Missing value for --address/,
  );
});

test("parsePerpsArgs rejects a port that is not a positive integer", () => {
  assert.throws(
    () => parsePerpsArgs(["sweep", "--address", ADDRESS, "--speculos-port", "abc"]),
    /Invalid --speculos-port "abc"/,
  );
});
