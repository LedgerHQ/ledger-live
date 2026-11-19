import assert from "node:assert/strict";
import test from "node:test";
import { knownSpeculosAddress, parseSpeculosArgs } from "./speculosSession";

test("parses a start with every option it needs", () => {
  assert.deepEqual(
    parseSpeculosArgs([
      "start",
      "--app",
      "Bitcoin",
      "--suite",
      "mobile-startup-perf",
      "--catalog",
      "catalog.json",
      "--out",
      "session.json",
    ]),
    {
      action: "start",
      app: "Bitcoin",
      suite: "mobile-startup-perf",
      catalog: "catalog.json",
      out: "session.json",
    },
  );
});

test("parses a stop by device id", () => {
  assert.deepEqual(parseSpeculosArgs(["stop", "--id", "bitcoin-lw-ci-123"]), {
    action: "stop",
    id: "bitcoin-lw-ci-123",
  });
});

test("rejects a start without its output file, and an unknown action", () => {
  assert.throws(
    () => parseSpeculosArgs(["start", "--app", "Bitcoin", "--suite", "s", "--catalog", "c"]),
    /Usage: pnpm e2e-cli speculos start/,
  );
  assert.throws(() => parseSpeculosArgs(["restart", "--id", "x"]), /Usage/);
});

test("adds the API port to a Speculinho address without one", () => {
  assert.equal(
    knownSpeculosAddress("https://bitcoin-1.speculos.example/", 443),
    "https://bitcoin-1.speculos.example:443",
  );
});

test("keeps an address that has its port, and defaults to the local Speculos", () => {
  assert.equal(knownSpeculosAddress("http://10.0.0.5:5001", 443), "http://10.0.0.5:5001");
  assert.equal(knownSpeculosAddress("10.0.0.5", 5001), "http://10.0.0.5:5001");
  assert.equal(knownSpeculosAddress("https://b.example//", 443), "https://b.example:443");
  assert.equal(knownSpeculosAddress(undefined, 5001), "http://127.0.0.1:5001");
});
