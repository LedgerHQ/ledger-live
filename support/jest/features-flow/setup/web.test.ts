// Pins the features-flow web setup against the jsdom worker it runs in.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

test("the web setup lets the process exit after React's scheduler ran", () => {
  const child = spawnSync(
    process.execPath,
    [path.join(import.meta.dirname, "web.exit.fixture.ts")],
    { encoding: "utf8", timeout: 10_000 },
  );

  assert.equal(child.signal, null, "the process did not exit on its own");
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout.trim(), "ran");
});
