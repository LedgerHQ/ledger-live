import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bootstrapMean,
  detectableAt80,
  hodgesLehmann,
  median,
  robustSd,
  unevenPhasesFactor,
} from "./stats.ts";

describe("median", () => {
  it("takes the middle value of an odd count", () => {
    assert.equal(median([3, 1, 2]), 2);
  });
  it("averages the two middle values of an even count", () => {
    assert.equal(median([4, 1, 3, 2]), 2.5);
  });
  it("is null without values", () => {
    assert.equal(median([]), null);
  });
});

describe("robustSd", () => {
  it("ignores a single outlier", () => {
    assert.equal(robustSd([1, 2, 3, 4, 100]), 1.4826);
  });
});

describe("hodgesLehmann", () => {
  it("gives no interval below six differences", () => {
    assert.deepEqual(hodgesLehmann([1, 2, 3]), { estimate: 2, low: null, high: null });
  });
  it("spans the extremes with exactly six differences", () => {
    assert.deepEqual(hodgesLehmann([0, 1, 2, 3, 4, 5]), { estimate: 2.5, low: 0, high: 5 });
  });
  it("is not pulled by one outlier", () => {
    assert.equal(hodgesLehmann([10, 10, 10, 10, 10, 1000])?.estimate, 10);
  });
  it("is null without differences", () => {
    assert.equal(hodgesLehmann([]), null);
  });
});

describe("unevenPhasesFactor", () => {
  it("leaves the interval of even phases as is", () => {
    assert.equal(unevenPhasesFactor(10, 10), 1);
  });
  it("widens it as the phases get uneven", () => {
    assert.equal(unevenPhasesFactor(3, 9).toFixed(3), "1.155");
    assert.equal(unevenPhasesFactor(9, 1).toFixed(3), "1.667");
  });
});

describe("detectableAt80", () => {
  it("adds 0.84 standard errors, read off the 95% interval, to the threshold", () => {
    const standardError = 100 / (2 * 1.959964);
    const detectable = detectableAt80({ estimate: 0, low: -50, high: 50 }, 100);
    assert.ok(detectable !== null);
    assert.ok(Math.abs(detectable - (100 + 0.8416 * standardError)) < 1e-9);
  });
  it("is null without an interval", () => {
    assert.equal(detectableAt80({ estimate: 0, low: null, high: null }, 100), null);
  });
});

describe("bootstrapMean", () => {
  const diffs = [12, -40, 33, 7, 85, -3, 21, 0];
  it("returns the same interval for the same differences", () => {
    assert.deepEqual(bootstrapMean(diffs), bootstrapMean(diffs));
  });
  it("brackets the mean", () => {
    const mean = bootstrapMean(diffs);
    assert.ok(mean);
    const { estimate, low, high } = mean;
    assert.equal(estimate, 14.375);
    assert.ok(low < estimate && estimate < high);
  });
  it("is null below six differences", () => {
    assert.equal(bootstrapMean([1, 2, 3]), null);
  });
});
