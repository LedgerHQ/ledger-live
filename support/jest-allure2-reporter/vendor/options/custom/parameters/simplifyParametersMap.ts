import type { KeyedParameterCustomizer } from '@support/jest-allure2-reporter';

import { compactObject, mapValues } from '../../../utils';
import * as extractors from '../../common';

import type { ParameterExtractor } from './types';
import { inflateParameter } from './inflateParameter';
import { keyedParameter } from './keyedParameter';

export function simplifyParametersMap<Context>(
  customizer: Record<string, KeyedParameterCustomizer<Context>>,
): Record<string, ParameterExtractor<Context>> {
  const result = mapValues(customizer, (value, key) => {
    const ambiguousCustomizer = keyedParameter<Context>(value, key);
    return ambiguousCustomizer
      ? extractors.compose2(inflateParameter(key), ambiguousCustomizer)
      : undefined;
  });

  return compactObject(result);
}
