import type {
  KeyedParameterCustomizer,
  MaybePromise,
  Parameter,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import {
  compactArray,
  groupBy,
  last,
  maybePromiseAll,
  thruMaybePromise,
  uniq,
} from '../../../utils';

import { simplifyParametersMap } from './simplifyParametersMap';

export function parametersMap<Context>(
  customizer: Record<string, KeyedParameterCustomizer<Context>>,
): PropertyExtractor<Context, MaybePromise<Parameter[]>> {
  const simplifiedCustomizer = simplifyParametersMap(customizer);
  const customizerKeys = Object.keys(simplifiedCustomizer);

  return async (context) => {
    return thruMaybePromise(context.value, (value) => {
      const parameters = groupBy(value, 'name');
      const keys = uniq([...customizerKeys, ...Object.keys(parameters)]);
      const batches: MaybePromise<Parameter | undefined>[] = keys.map((key) => {
        const keyedContext = { ...context, value: last(parameters[key]) };
        const keyedCustomizer = simplifiedCustomizer[key];
        return keyedCustomizer ? keyedCustomizer(keyedContext) : keyedContext.value;
      });

      return maybePromiseAll(batches, (batch) => compactArray(batch) as Parameter[]);
    });
  };
}
