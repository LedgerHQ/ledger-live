import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarise } from "./analyze.ts";
import { comparison, withFallback } from "./fake-samples.ts";
import { toMarkdown } from "./report.ts";

describe("toMarkdown", () => {
  const options = {
    preset: "custom",
    labelA: "live-mobile@4.27.0",
    labelB: "release",
    thresholdMs: 100,
  };

  it("writes one table row per platform and scenario with its verdict", () => {
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 200 }), options), options);
    assert.match(markdown, /^### Startup time, custom: B − A$/m);
    assert.match(markdown, /^A = live-mobile@4\.27\.0 · B = release\.$/m);
    assert.match(
      markdown,
      /^\| android \| accounts \| Debug screen \| 6 \| .* \| FAIL: B is slower by more than 100 ms \|$/m,
    );
  });

  it("states the gate only for presets that gate B against A", () => {
    const aa = { ...options, preset: "aa-noise" };
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 0 }), aa), aa);
    assert.doesNotMatch(markdown, /B fails when/);
  });

  for (const preset of ["prod-vs-release", "prod-vs-develop", "custom"]) {
    it(`states the gate for ${preset}`, () => {
      const gated = { ...options, preset };
      const markdown = toMarkdown(summarise(comparison({ deltaMs: 0 }), gated), gated);
      assert.match(markdown, /^B fails when it is slower than A by more than 100 ms/m);
    });
  }

  it("says a launch that fell back to the first JS import is left out", () => {
    const markdown = toMarkdown(summarise(withFallback(), options), options);
    assert.match(
      markdown,
      /1 launch\(es\) of build B counted from the first JS import, not the process start \(the app found none\), and are left out\./,
    );
  });

  it("names each build whose launches counted from the first JS import", () => {
    const js = { jsStartOffset: 0 };
    const markdown = toMarkdown(
      summarise(comparison({ deltaMs: 0, a: js, b: js }), options),
      options,
    );
    for (const side of ["A", "B"]) {
      assert.match(
        markdown,
        new RegExp(`6 launch\\(es\\) of build ${side} counted from the first JS import`),
      );
    }
    assert.match(markdown, /\| Not enough pairs \|$/m);
  });

  it("says what known-regression's B is", () => {
    const known = { ...options, preset: "known-regression" };
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 300 }), known), known);
    assert.match(markdown, /^B is A with LIVE-36190 re-added/m);
  });
});
