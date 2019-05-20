// @flow
// Utility to deal with ranges

export type Range = {
  initial: number,
  min: number,
  max: number,
  step: number,
  steps: number
};

const defaultOpts: InferDynamicRangeOpts = {
  minMult: 0.3,
  maxMult: 2,
  targetSteps: 20
};

export type InferDynamicRangeOpts = typeof defaultOpts;

// infer a range from ONE estimated fees value.
// e.g. we just have a "gasPrice" and we want a slider to move a gas value around it.
// to test this:
// for (let i = 0.1; i < 10; i += 0.1) console.log(i, inferDynamicRange(i));
export function inferDynamicRange(
  amount: number,
  opts: $Shape<InferDynamicRangeOpts> = {}
): Range {
  const { minMult, maxMult, targetSteps } = { ...defaultOpts, ...opts };
  const targetMin = amount * minMult;
  const targetMax = amount * maxMult;
  const step = findBestRangeStep(targetMin, targetMax, targetSteps);
  if (Number.isNaN(step) || step <= 0) {
    throw new Error("inferDynamicRange: invalid parameters");
  }
  const initial = round(amount, step);
  const min = floor(targetMin, step);
  const max = ceil(targetMax, step);
  const steps = 1 + (max - min) / step;
  return { initial, min, max, step, steps };
}

export function projectRangeIndex(range: Range, index: number): number {
  return range.min + index * range.step;
}

export function reverseRangeIndex(range: Range, n: number): number {
  const x = (n - range.min) / (range.max - range.min);
  const i = Math.floor(range.steps * x);
  return Math.max(0, Math.min(i, range.steps - 1));
}

function floor(n, step) {
  return Math.floor(n / step) * step;
}

function ceil(n, step) {
  return Math.ceil(n / step) * step;
}

function round(n, step) {
  return Math.round(n / step) * step;
}

const log10 = Math.log(10);

// return step to use for a [min,max] with a planned number of steps (will approx).
function findBestRangeStep(min, max, steps) {
  const nonRoundedStep = (max - min) / steps;
  const mag = Math.log(nonRoundedStep) / log10;
  const magInt = Math.floor(mag);
  const remain = mag - magInt;
  let step = 10 ** (magInt + 1);
  // heuristics
  if (remain < 0.3) step /= 5;
  else if (remain < 0.7) step /= 2;
  return step;
}
