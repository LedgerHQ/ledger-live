import type { AllureTestCaseResult, Label } from '@support/jest-allure2-reporter';

const SINGLE_LABELS = new Set([
  'owner',
  'package',
  'parentSuite',
  'severity',
  'subSuite',
  'suite',
  'testClass',
  'testMethod',
  'thread',
]);

export function normalizeLabels(test: AllureTestCaseResult) {
  if (test.labels) {
    const accumulator: Record<string, Label[]> = {};

    for (const label of test.labels) {
      if (SINGLE_LABELS.has(label.name)) {
        accumulator[label.name] = [label];
      } else {
        accumulator[label.name] = accumulator[label.name] || [];
        accumulator[label.name].push(label);
      }
    }

    return Object.values<Label[]>(accumulator).flat();
  }

  return;
}
