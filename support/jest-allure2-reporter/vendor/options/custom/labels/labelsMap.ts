import type {
  KeyedLabelCustomizer,
  Label,
  MaybePromise,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import { asMaybeArray, groupBy, maybePromiseAll, thruMaybePromise, uniq } from '../../../utils';

import { simplifyLabelsMap } from './simplifyLabelsMap';

export function labelsMap<Context>(
  customizer: Record<string, KeyedLabelCustomizer<Context>>,
): PropertyExtractor<Context, Label[], MaybePromise<Label[]>> {
  const simplifiedCustomizer = simplifyLabelsMap(customizer);
  const customizerKeys = Object.keys(simplifiedCustomizer);

  return async (context) => {
    return thruMaybePromise(context.value, (value) => {
      const labels = groupBy(value, 'name');
      const keys = uniq([...customizerKeys, ...Object.keys(labels)]);
      const batches: MaybePromise<Label[]>[] = keys.map((key) => {
        const keyedContext = { ...context, value: asMaybeArray(labels[key]) };
        const keyedCustomizer = simplifiedCustomizer[key];
        return keyedCustomizer ? keyedCustomizer(keyedContext) : keyedContext.value;
      });

      return maybePromiseAll(batches, (batches) => batches.flat());
    });
  };
}
