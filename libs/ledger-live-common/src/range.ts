// Utility to deal with ranges
import { BigNumber } from "bignumber.js";
export type Range = {
  initial: BigNumber;
  min: BigNumber;
  max: BigNumber;
  step: BigNumber;
  steps: number;
};
export type RangeRaw = {
  initial: string;
  min: string;
  max: string;
  step: string;
  steps: number;
};
export function fromRangeRaw(r: RangeRaw): Range {
  return {
    initial: new BigNumber(r.initial),
    min: new BigNumber(r.min),
    max: new BigNumber(r.max),
    step: new BigNumber(r.step),
    steps: r.steps,
  };
}
export function toRangeRaw(r: Range): RangeRaw {
  return {
    initial: r.initial.toString(),
    min: r.min.toString(),
    max: r.max.toString(),
    step: r.step.toString(),
    steps: r.steps,
  };
}
const defaultOpts: InferDynamicRangeOpts = {
  minMult: 0.3,
  maxMult: 2,
  targetSteps: 20,
};
export type InferDynamicRangeOpts = {
  minMult: number;
  maxMult: number;
  targetSteps: number;
  minValue?: BigNumber | null;
  maxValue?: BigNumber | null;
};
// infer a range from ONE estimated fees value.
// e.g. we just have a "gasPrice" and we want a slider to move a gas value around it.
// to test this:
// for (let i = 0.1; i < 10; i += 0.1) console.log(i, inferDynamicRange(i));
export function inferDynamicRange(
  amount: BigNumber,
  opts: Partial<InferDynamicRangeOpts> = {},
): Range {
  const { minMult, maxMult, targetSteps, minValue, maxValue } = {
    ...defaultOpts,
    ...opts,
  };
  const targetMin = minValue || amount.times(minMult);
  const targetMax = maxValue || amount.times(maxMult);
  const step = findBestRangeStep(targetMin, targetMax, targetSteps);

  if (Number.isNaN(step) || step.lte(0)) {
    throw new Error("inferDynamicRange: invalid parameters");
  }

  const initial = stepping(amount, step, BigNumber.ROUND_CEIL);
  const min = stepping(targetMin, step, BigNumber.ROUND_CEIL);
  const max = stepping(targetMax, step, BigNumber.ROUND_CEIL);
  const steps = max.minus(min).div(step).plus(1).toNumber();
  return {
    initial,
    min,
    max,
    step,
    steps,
  };
}
export function projectRangeIndex(range: Range, index: number): BigNumber {
  return range.min.plus(range.step.times(index));
}
export function reverseRangeIndex(range: Range, n: BigNumber): number {
  const x = n.minus(range.min).div(range.max.minus(range.min));
  const i = x.times(range.steps).integerValue(BigNumber.ROUND_FLOOR).toNumber();
  return Math.max(0, Math.min(i, range.steps - 1));
}

function stepping(n, step, roundingMode) {
  return n.div(step).integerValue(roundingMode).times(step);
}

const log10 = Math.log(10);

// return step to use for a [min,max] with a planned number of steps (will approx).
function findBestRangeStep(min: BigNumber, max: BigNumber, steps: number) {
  const nonRoundedStep = (max.toNumber() - min.toNumber()) / steps;
  const mag = Math.log(nonRoundedStep) / log10;
  const magInt = Math.floor(mag);
  const remain = mag - magInt;
  let step = new BigNumber(10).pow(magInt);
  // heuristics
  if (remain < 0.3) {
    step = step.div(5);
  } else if (remain < 0.7) {
    step = step.div(2);
  }
  return step;
}
