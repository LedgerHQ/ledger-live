import type {
  AllureTestCaseResult,
  AllureTestStepResult,
  PromisedProperties,
} from '@support/jest-allure2-reporter';

import { onceWithLoopDetection, resolvePromisedProperties } from '../utils';

import type { TestCaseExtractor, TestStepsExtractor } from './types';

async function resolveSteps(steps: PromisedProperties<AllureTestStepResult>[] | undefined) {
  if (!steps) {
    return;
  }

  const statuses = await Promise.all(steps.map((s) => s.ignored));
  const notIgnoredSteps = steps.filter((_step, index) => !statuses[index]);
  const result = await Promise.all(notIgnoredSteps.map(resolvePromisedProperties));
  for (const innerStep of result) {
    await resolveSteps(innerStep.steps);
  }

  return result;
}

export function combineTestCaseAndSteps<Context>(
  testCase: TestCaseExtractor<Context>,
  testSteps: TestStepsExtractor<Context>,
): TestCaseExtractor<Context, void> {
  return function combinedExtractor(context) {
    const test = testCase({ ...context, value: {} as PromisedProperties<AllureTestCaseResult> });
    const steps = testSteps({ ...context, value: [] });

    Object.defineProperty(test, 'steps', {
      enumerable: true,
      get: onceWithLoopDetection(resolveSteps.bind(null, steps)),
    });

    return test;
  };
}
