import { BigNumber } from "bignumber.js";
import { avoidDups, clampFeesToFloor } from "./getAccountNetworkInfo";

test("avoidFeeDupsInFeePerByte [3,2,2] => [4,3,2]", async () => {
  expect(avoidDups([new BigNumber(3), new BigNumber(3), new BigNumber(2)])).toEqual([
    new BigNumber(4),
    new BigNumber(3),
    new BigNumber(2),
  ]);
});
test("avoidFeeDupsInFeePerByte [2,2,1] => [3,2,1]", async () => {
  expect(avoidDups([new BigNumber(2), new BigNumber(2), new BigNumber(1)])).toEqual([
    new BigNumber(3),
    new BigNumber(2),
    new BigNumber(1),
  ]);
});
test("avoidFeeDupsInFeePerByte [3,3,3] => [5,4,3]", async () => {
  expect(avoidDups([new BigNumber(3), new BigNumber(3), new BigNumber(3)])).toEqual([
    new BigNumber(5),
    new BigNumber(4),
    new BigNumber(3),
  ]);
});
test("avoidFeeDupsInFeePerByte [3,2,1] => [3,2,1]", async () => {
  expect(avoidDups([new BigNumber(3), new BigNumber(2), new BigNumber(1)])).toEqual([
    new BigNumber(3),
    new BigNumber(2),
    new BigNumber(1),
  ]);
});
test("avoidFeeDupsInFeePerByte [100,100,1] => [101,100,1]", async () => {
  expect(avoidDups([new BigNumber(100), new BigNumber(100), new BigNumber(1)])).toEqual([
    new BigNumber(101),
    new BigNumber(100),
    new BigNumber(1),
  ]);
});

const BN = (n: BigNumber.Value) => new BigNumber(n);

/* NOTE: passes right now 
 *
test("avoidFeeDupsInFeePerByte does not mutate input array", () => {
  const input = [BN(2), BN(2), BN(1)];
  const before = input.map(b => b.toString());
  const out = avoidDups(input);
  expect(out).not.toBe(input); // new array
  expect(input.map(b => b.toString())).toEqual(before); // original unchanged
});

test("avoidFeeDupsInFeePerByte works with ascending input [1,2,3] => [5,4,3]", () => {
  expect(avoidDups([BN(1), BN(2), BN(3)])).toEqual([BN(5), BN(4), BN(3)]);
});

test("avoidFeeDupsInFeePerByte handles zeros [0,0,0] => [2,1,0]", () => {
  expect(avoidDups([BN(0), BN(0), BN(0)])).toEqual([BN(2), BN(1), BN(0)]);
});

test("avoidFeeDupsInFeePerByte longer array [5,5,5,5] => [8,7,6,5]", () => {
  expect(avoidDups([BN(5), BN(5), BN(5), BN(5)])).toEqual([BN(8), BN(7), BN(6), BN(5)]);
});

test("avoidFeeDupsInFeePerByte big jump on the right [1,1,100] => [102,101,100]", () => {
  expect(avoidDups([BN(1), BN(1), BN(100)])).toEqual([BN(102), BN(101), BN(100)]);
});
*/

describe("clampFeesToFloor", () => {
  test("clamps to ≥ floor+1 and returns integers", () => {
    const floor = BN(1);
    expect(clampFeesToFloor([BN(0), BN(1), BN(2)], floor)).toEqual([BN(2), BN(2), BN(2)]);
  });

  test("rounds up fractional inputs and applies floor+1", () => {
    const floor = BN(1);
    const out = clampFeesToFloor([BN("0.9"), BN("1.01"), BN("1.5")], floor);
    expect(out).toEqual([BN(2), BN(2), BN(2)]);
    out.forEach(x => expect(x.isInteger()).toBe(true));
  });

  test("no-op when all are already ≥ floor+1", () => {
    const floor = BN(1);
    expect(clampFeesToFloor([BN(5), BN(3), BN(2)], floor)).toEqual([BN(5), BN(3), BN(2)]);
  });

  test("respects custom epsilon (e.g., ε=2 ⇒ ≥ floor+2)", () => {
    const floor = BN(1);
    const eps = BN(2);
    // floor+eps = 3
    expect(clampFeesToFloor([BN(1), BN(2), BN(3)], floor, eps)).toEqual([BN(3), BN(3), BN(3)]);
  });

  test("pipeline: clamp then avoidDups yields strict descending", () => {
    const floor = BN(1);
    const clamped = clampFeesToFloor([BN(1), BN(1), BN(1)], floor); // -> [2,2,2]
    const ordered = avoidDups(clamped); // -> [4,3,2]
    expect(ordered).toEqual([BN(4), BN(3), BN(2)]);
    for (let i = 0; i < ordered.length - 1; i++) {
      expect(ordered[i].gt(ordered[i + 1])).toBe(true);
    }
  });
});

describe("avoidDups (existing cases)", () => {
  test("does not mutate input", () => {
    const input = [BN(2), BN(2), BN(1)];
    const before = input.map(x => x.toString());
    const out = avoidDups(input);
    expect(out).not.toBe(input);
    expect(input.map(x => x.toString())).toEqual(before);
  });

  test("ascending input [1,2,3] => [5,4,3]", () => {
    expect(avoidDups([BN(1), BN(2), BN(3)])).toEqual([BN(5), BN(4), BN(3)]);
  });

  test("zeros [0,0,0] => [2,1,0]", () => {
    expect(avoidDups([BN(0), BN(0), BN(0)])).toEqual([BN(2), BN(1), BN(0)]);
  });

  test("longer array [5,5,5,5] => [8,7,6,5]", () => {
    expect(avoidDups([BN(5), BN(5), BN(5), BN(5)])).toEqual([BN(8), BN(7), BN(6), BN(5)]);
  });
});
