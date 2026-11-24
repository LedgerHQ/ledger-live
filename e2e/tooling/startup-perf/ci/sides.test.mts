import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { outputsOf, sidesLeft, sidesOf, summaryOf } from "./sides.mts";

const NONE = { a: false, snapshot: false };
const NOTHING = { android: NONE, ios: NONE };

describe("sidesLeft", () => {
  it("leaves out a restored build A or snapshot, and keeps every side otherwise", () => {
    const all = ["a", "b", "snapshot"];
    assert.deepEqual(sidesLeft(all, { a: true, snapshot: false }), ["b", "snapshot"]);
    assert.deepEqual(sidesLeft(all, { a: false, snapshot: true }), ["a", "b"]);
    assert.deepEqual(sidesLeft(all, { a: true, snapshot: true }), ["b"]);
    assert.deepEqual(sidesLeft(all, NONE), all);
    assert.deepEqual(sidesLeft(["a", "snapshot"], { a: true, snapshot: true }), []);
  });
});

describe("outputsOf", () => {
  it("writes each platform's sides, and what save-cache caches of what it makes", () => {
    assert.equal(
      outputsOf(
        ["a", "b", "snapshot"],
        { android: { a: true, snapshot: false }, ios: { a: false, snapshot: true } },
        true,
      ),
      [
        'android=["b","snapshot"]',
        "android_save_a=false",
        "android_save_snapshot=true",
        'ios=["a","b"]',
        "ios_save_a=true",
        "ios_save_snapshot=false",
        "",
      ].join("\n"),
    );
    assert.equal(
      outputsOf(
        ["a"],
        { android: { a: true, snapshot: false }, ios: { a: true, snapshot: false } },
        true,
      ),
      [
        "android=[]",
        "android_save_a=false",
        "android_save_snapshot=false",
        "ios=[]",
        "ios_save_a=false",
        "ios_save_snapshot=false",
        "",
      ].join("\n"),
    );
  });

  it("never has save-cache cache a build A that is no release tag's", () => {
    assert.match(outputsOf(["a", "b", "snapshot"], NOTHING, false), /^android_save_a=false$/m);
    assert.match(
      outputsOf(["a", "b", "snapshot"], NOTHING, false),
      /^android_save_snapshot=true$/m,
    );
  });
});

describe("summaryOf", () => {
  it("names what each platform restored from the cache", () => {
    assert.equal(
      summaryOf(
        { android: { a: false, snapshot: true }, ios: { a: true, snapshot: false } },
        "live-mobile@4.29.0",
      ),
      [
        "- Android accounts snapshot of live-mobile@4.29.0 restored from the cache",
        "- iOS build A restored from the cache",
        "",
      ].join("\n"),
    );
    assert.equal(summaryOf(NOTHING), "");
  });
});

describe("sidesOf", () => {
  it("reads the plan's sides, and refuses anything else", () => {
    assert.deepEqual(sidesOf('["a","b","snapshot"]'), ["a", "b", "snapshot"]);
    for (const json of ["", '"a"', "[1]", "{}"]) {
      assert.throws(() => sidesOf(json), /SIDES must be a JSON array of sides/);
    }
  });
});
