import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { outputsOf, sidesLeft, sidesOf, summaryOf } from "./sides.mts";

const NOTHING = { android: { a: false }, ios: { a: false } };

describe("sidesLeft", () => {
  it("leaves out a restored build A, and keeps every side otherwise", () => {
    assert.deepEqual(sidesLeft(["a", "b"], { a: true }), ["b"]);
    assert.deepEqual(sidesLeft(["a", "b"], { a: false }), ["a", "b"]);
    assert.deepEqual(sidesLeft(["a"], { a: true }), []);
  });
});

describe("outputsOf", () => {
  it("writes each platform's sides, and whether save-cache caches the A it builds", () => {
    assert.equal(
      outputsOf(["a", "b"], { android: { a: true }, ios: { a: false } }, true),
      ['android=["b"]', "android_save_a=false", 'ios=["a","b"]', "ios_save_a=true", ""].join("\n"),
    );
    assert.equal(
      outputsOf(["a"], { android: { a: true }, ios: { a: true } }, true),
      ["android=[]", "android_save_a=false", "ios=[]", "ios_save_a=false", ""].join("\n"),
    );
  });

  it("never has save-cache cache a build A that is no release tag's", () => {
    assert.equal(
      outputsOf(["a", "b"], NOTHING, false),
      ['android=["a","b"]', "android_save_a=false", 'ios=["a","b"]', "ios_save_a=false", ""].join(
        "\n",
      ),
    );
  });
});

describe("summaryOf", () => {
  it("names each platform whose build A came from the cache", () => {
    assert.equal(
      summaryOf({ android: { a: false }, ios: { a: true } }),
      "- iOS build A restored from the cache\n",
    );
    assert.equal(summaryOf(NOTHING), "");
  });
});

describe("sidesOf", () => {
  it("reads the plan's sides, and refuses anything else", () => {
    assert.deepEqual(sidesOf('["a","b"]'), ["a", "b"]);
    for (const json of ["", '"a"', "[1]", "{}"]) {
      assert.throws(() => sidesOf(json), /SIDES must be a JSON array of sides/);
    }
  });
});
