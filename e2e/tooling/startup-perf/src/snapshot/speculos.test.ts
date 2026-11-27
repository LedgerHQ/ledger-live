import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSession } from "./speculos.ts";

test("reads the session e2e-cli speculos start wrote, with its token", () => {
  assert.deepEqual(
    parseSession(
      '{"id":"bitcoin-lw-ci-1","address":"https://b:443","model":"nanoSP","sessionToken":"t"}',
    ),
    { id: "bitcoin-lw-ci-1", address: "https://b:443", model: "nanoSP", sessionToken: "t" },
  );
});

test("reads a session without a token, from an unprotected Speculinho or a local Speculos", () => {
  assert.deepEqual(parseSession('{"id":"b","address":"http://127.0.0.1:5001","model":"nanoX"}'), {
    id: "b",
    address: "http://127.0.0.1:5001",
    model: "nanoX",
  });
});

test("rejects a session file without its address", () => {
  assert.throws(() => parseSession('{"id":"b","model":"nanoX"}'), /no id, address or model/);
});
