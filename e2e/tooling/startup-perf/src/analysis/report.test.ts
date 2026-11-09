import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarise } from "./analyze.ts";
import { comparison, startsDifferWithFallback } from "./fake-samples.ts";
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

  for (const preset of ["prod-vs-release", "prod-vs-develop", "custom"]) {
    it(`states the gate for ${preset}`, () => {
      const gated = { ...options, preset };
      const markdown = toMarkdown(summarise(comparison({ deltaMs: 0 }), gated), gated);
      assert.match(markdown, /^B fails when it is slower than A by more than 100 ms/m);
    });
  }

  it("says a launch that fell back is kept in the row from the first JS import", () => {
    const markdown = toMarkdown(summarise(startsDifferWithFallback(), options), options);
    assert.match(
      markdown,
      /1 launch\(es\) of build B counted from another start than the process start .* are kept in the row from the first JS import/,
    );
  });

  it("says which launches were read from the screen, and whether the screen matched the log", () => {
    const samples = comparison({
      deltaMs: 0,
      a: { readFrom: "log" },
      b: { readFrom: "log", screenAppStartupTime: 1000 },
    });
    const fellBack = samples.find(s => s.side === "A");
    if (!fellBack) throw new Error("no A launch");
    fellBack.readFrom = "screen";
    const agreed = toMarkdown(summarise(samples, options), options);
    assert.match(agreed, /android accounts: 1 launch\(es\) read from the Debug screen/);
    assert.match(
      agreed,
      /showed the device log's App startup time on the 6 launches read both ways/,
    );

    const differs = samples.find(s => s.side === "B");
    if (!differs) throw new Error("no B launch");
    differs.screenAppStartupTime = 1040;
    assert.match(
      toMarkdown(summarise(samples, options), options),
      /\*\*android accounts: the Debug screen showed another App startup time than the device log on 1 of the 6 launches read both ways\.\*\*/,
    );
  });

  it("adds no read note to launches measured before the log line", () => {
    assert.doesNotMatch(
      toMarkdown(summarise(comparison({ deltaMs: 0 }), options), options),
      /read from the Debug screen|read both ways/,
    );
  });

  it("says what known-regression's B is", () => {
    const known = { ...options, preset: "known-regression" };
    const markdown = toMarkdown(summarise(comparison({ deltaMs: 300 }), known), known);
    assert.match(markdown, /^B is A with LIVE-36190 re-added/m);
  });
});
