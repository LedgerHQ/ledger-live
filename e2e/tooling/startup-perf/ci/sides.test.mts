import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BuildEntry } from "./resolve-refs.mts";
import { buildsLeft, buildsOf, outputsOf, summaryOf } from "./sides.mts";

const A: BuildEntry = { side: "a", ref: "a".repeat(40), regression: "" };
const B: BuildEntry = { side: "b", ref: "b".repeat(40), regression: "" };
const NONE = { a: false, snapshot: false };
const NOTHING = { android: NONE, ios: NONE };
const lines = (text: string) => text.trim().split("\n");

describe("buildsLeft", () => {
  it("leaves out a restored build A, and keeps every entry otherwise", () => {
    assert.deepEqual(buildsLeft([A, B], { a: true, snapshot: false }), [B]);
    assert.deepEqual(buildsLeft([A, B], { a: false, snapshot: true }), [A, B]);
    assert.deepEqual(buildsLeft([A], { a: true, snapshot: true }), []);
  });
});

describe("outputsOf", () => {
  it("writes each platform's entries, whether it makes the snapshot and what save-cache caches", () => {
    const outputs = outputsOf(
      [A, B],
      { android: { a: true, snapshot: false }, ios: { a: false, snapshot: true } },
      { cacheA: true, snapshot: true },
    );
    assert.deepEqual(lines(outputs), [
      `android_builds=${JSON.stringify([B])}`,
      "android_save_a=false",
      "android_snapshot=true",
      `ios_builds=${JSON.stringify([A, B])}`,
      "ios_save_a=true",
      "ios_snapshot=false",
    ]);
  });

  it("makes no snapshot the run does not need, and caches no build A that is no release tag's", () => {
    const outputs = outputsOf([A, B], NOTHING, { cacheA: false, snapshot: false });
    assert.match(outputs, /^android_save_a=false$/m);
    assert.match(outputs, /^android_snapshot=false$/m);
    assert.match(outputs, /^ios_snapshot=false$/m);
  });
});

describe("summaryOf", () => {
  it("names what each platform restored from the cache", () => {
    assert.deepEqual(
      lines(
        summaryOf(
          { android: { a: false, snapshot: true }, ios: { a: true, snapshot: false } },
          "live-mobile@4.29.0",
        ),
      ),
      [
        "- Android accounts snapshot of live-mobile@4.29.0 restored from the cache",
        "- iOS build A restored from the cache",
      ],
    );
    assert.equal(summaryOf(NOTHING), "");
  });
});

describe("buildsOf", () => {
  it("reads the plan's build matrix entries, and refuses anything else", () => {
    assert.deepEqual(buildsOf(JSON.stringify([A, B])), [A, B]);
    for (const json of ["", '["a"]', '[{"side":"c","ref":"x","regression":""}]', "{}"]) {
      assert.throws(() => buildsOf(json), /BUILDS must be the plan's build matrix entries/);
    }
  });
});
