import type {
  MaybeNullish,
  MaybePromise,
  Parameter,
  ParametersCustomizer,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import * as extractors from '../../common';

import { parametersMap } from './parametersMap';

export function parameters<Context>(
  customizer: ParametersCustomizer<Context>,
): PropertyExtractor<Context, MaybePromise<Parameter[]>>;
export function parameters<Context>(
  customizer: MaybeNullish<ParametersCustomizer<Context>>,
): PropertyExtractor<Context, MaybePromise<Parameter[]>> | undefined;
export function parameters<Context>(
  customizer: MaybeNullish<ParametersCustomizer<Context>>,
): PropertyExtractor<Context, MaybePromise<Parameter[]>> | undefined {
  if (customizer == null) {
    return;
  }

  if (typeof customizer === 'function') {
    return customizer;
  }

  if (Array.isArray(customizer)) {
    return extractors.appender(customizer);
  }

  return parametersMap(customizer);
}
