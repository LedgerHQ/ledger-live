import type {
  AllureTestItemMetadata,
  AllureTestStepResult,
  TestStepExtractorContext,
  PromisedProperties,
} from '@support/jest-allure2-reporter';

import type { TestStepExtractor, TestStepsExtractor } from '../types';

type HasMetadata<Context, Key extends keyof Context> = Context & {
  [key in Key]: AllureTestItemMetadata;
};

export function testCaseSteps<
  BaseContext extends Partial<TestStepExtractorContext>,
  Key extends keyof BaseContext,
  Context extends HasMetadata<BaseContext, Key>,
>(
  testStep: TestStepExtractor<TestStepExtractorContext>,
  metadataKey: Key,
): TestStepsExtractor<Context, void> {
  const stepsExtractor: TestStepsExtractor<Context, void> = (
    context,
  ): PromisedProperties<AllureTestStepResult>[] | undefined => {
    const steps = context[metadataKey]?.steps;
    if (!steps || steps.length === 0) {
      return;
    }

    return steps.map((testStepMetadata) => {
      const testStepContext: any = {
        ...context,
        testStepMetadata,
        result: {},
        value: {
          ...testStepMetadata,
        },
      };

      testStepContext.result = testStep(testStepContext);

      const promisedProperties = testStep(testStepContext);
      Object.defineProperty(promisedProperties, 'steps', {
        enumerable: true,
        get: () => innerStepsExtractor(testStepContext),
      });

      return promisedProperties;
    });
  };

  const innerStepsExtractor =
    metadataKey === 'testStepMetadata'
      ? stepsExtractor
      : testCaseSteps(testStep, 'testStepMetadata');

  return stepsExtractor;
}
