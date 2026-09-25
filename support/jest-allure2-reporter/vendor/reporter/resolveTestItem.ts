import type {
  AllureTestCaseResult,
  PromisedProperties,
  PropertyExtractor,
  TestItemExtractorContext,
} from '@support/jest-allure2-reporter';

import { log } from '../logger';
import { resolvePromisedProperties } from '../utils';

export async function resolvePromisedTestCase<
  Context extends TestItemExtractorContext<AllureTestCaseResult>,
>(
  context: Context,
  extractor: PropertyExtractor<Context, PromisedProperties<AllureTestCaseResult>>,
): Promise<AllureTestCaseResult | undefined> {
  const promisedItem = preparePromisedItem(context, extractor, 'result');
  try {
    if (await promisedItem.ignored) {
      return;
    }

    return await resolvePromisedProperties(promisedItem);
  } catch (error: unknown) {
    log.error(error, 'Failed to report test case');
    return;
  }
}

export async function resolvePromisedItem<Context, ResultKey extends keyof Context, Result>(
  context: Context,
  extractor: PropertyExtractor<Context, PromisedProperties<Result>>,
  resultKey: ResultKey,
): Promise<Result> {
  return await resolvePromisedProperties<Result>(
    preparePromisedItem(context, extractor, resultKey),
  );
}

function preparePromisedItem<Context, ResultKey extends keyof Context, Result>(
  context: Context,
  extractor: PropertyExtractor<Context, PromisedProperties<Result>>,
  resultKey: ResultKey,
): PromisedProperties<Result> {
  const value = {} as Result;
  const firstPass = extractor({ ...context, value, [resultKey]: value });
  const secondPass = extractor({ ...context, value, [resultKey]: firstPass });

  return secondPass;
}
