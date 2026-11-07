import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarise } from "./analyze.ts";
import { comparison } from "./fake-samples.ts";
import { toMarkdown } from "./report.ts";

describe("toMarkdown", () => {
  const options = {
    preset: "custom",
    labelA: "live-mobile@4.27.0",
    labelB: "release",
    thresholdMs: 100,
  };

  it("writes one table row per measure with its verdict", () => {
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 200 }), options), options);
    assert.match(markdown, /^### Startup time, custom: B − A$/m);
    assert.match(markdown, /^A = live-mobile@4\.27\.0 · B = release\.$/m);
    assert.match(
      markdown,
      /^\| android \| accounts \| Debug screen \| 6 \| .* \| FAIL: B is slower by more than 100 ms \|$/m,
    );
    assert.match(markdown, /^\| android \| accounts \| With native start \| 6 \| /m);
  });

  it("states the gate only for presets that gate B against A", () => {
    const aa = { ...options, preset: "aa-noise" };
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 0 }), aa), aa);
    assert.doesNotMatch(markdown, /B fails when/);
  });

  it("says what known-regression's B is", () => {
    const known = { ...options, preset: "known-regression" };
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 300 }), known), known);
    assert.match(markdown, /^B is A with LIVE-36190 re-added/m);
  });
});
