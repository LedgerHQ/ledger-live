import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';
import { v5 } from 'uuid';
import type { Container as AllureContainer } from 'allure-store';

import { toTestStep } from './toTestStep';

const NAMESPACE = v5('@support/jest-allure2-reporter', '00000000-0000-0000-0000-000000000000');

export type TestContainerOptions = {
  name: string;
  rootDir: string;
  testUUID: string;
};

export function toTestContainer(
  test: AllureTestCaseResult,
  options: TestContainerOptions,
): AllureContainer {
  return {
    uuid: v5(options.testUUID, NAMESPACE),
    name: options.name,
    children: [options.testUUID],
    befores: test.steps
      ?.filter((step) => step.hookType?.startsWith('before'))
      .map((step) => toTestStep(options.rootDir, step)),
    afters: test.steps
      ?.filter((step) => step.hookType?.startsWith('after'))
      .map((step) => toTestStep(options.rootDir, step)),
  };
}
