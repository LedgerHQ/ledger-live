import assert from "node:assert/strict";
import test from "node:test";
import { assertRemoteSpeculos, parseSpeculosArgs } from "./speculosSession";

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

test("holds Speculinho sessions only: a local container would outlive its process", () => {
  assert.doesNotThrow(() => assertRemoteSpeculos({ REMOTE_SPECULOS: "true" }));
  assert.throws(() => assertRemoteSpeculos({}), /REMOTE_SPECULOS=true/);
});
