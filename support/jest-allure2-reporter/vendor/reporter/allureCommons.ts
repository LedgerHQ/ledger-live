import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';
import type { AllureWriter } from 'allure-store';

import { toTestContainer, toTestResult } from './allure-adapter';

type CreateTestArguments = {
  resultsDir: string;
  writer: AllureWriter;
  containerName: string;
  test: AllureTestCaseResult;
};

export async function writeTest({ resultsDir, writer, test, containerName }: CreateTestArguments) {
  const testResult = toTestResult(resultsDir, test);
  const testContainer = toTestContainer(test, {
    rootDir: resultsDir,
    name: containerName,
    testUUID: testResult.uuid,
  });

  await writer.writeContainer(testContainer);
  await writer.writeResult(testResult);
}
