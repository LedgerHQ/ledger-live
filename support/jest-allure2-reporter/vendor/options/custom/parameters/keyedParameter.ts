import type { KeyedParameterCustomizer, Primitive } from '@support/jest-allure2-reporter';

import * as extractors from '../../common';

import type { ParameterOrPrimitiveExtractor } from './types';
import { isParameter } from './isParameter';

export function keyedParameter<Context>(
  value: KeyedParameterCustomizer<Context>,
  key: string,
): ParameterOrPrimitiveExtractor<Context> | undefined {
  if (value == null) {
    return;
  }

  if (typeof value === 'function') {
    return value as ParameterOrPrimitiveExtractor<Context>;
  }

  return extractors.constant(
    isParameter(value)
      ? {
          ...value,
          name: key,
        }
      : { name: key, value: value as Primitive },
  );
}
