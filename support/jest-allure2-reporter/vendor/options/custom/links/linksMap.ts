import type {
  KeyedLinkCustomizer,
  KeyedLinkExtractor,
  Link,
  MaybeArray,
  MaybeNullish,
  MaybePromise,
  PropertyExtractorContext,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import {
  asMaybeArray,
  compactArray,
  compactObject,
  groupBy,
  mapValues,
  maybePromiseAll,
  thruMaybePromise,
  uniq,
} from '../../../utils';

import { keyedLink } from './keyedLink';

export function linksMap<Context>(
  customizer: Record<string, KeyedLinkCustomizer<Context>>,
): PropertyExtractor<Context, MaybePromise<Link[]>> {
  const simplifiedCustomizer = simplifyLinksMap(customizer);
  const customizerKeys = Object.keys(simplifiedCustomizer);

  return async ({ value, ...context }) => {
    return thruMaybePromise(value, (value): MaybePromise<Link[]> => {
      const links = groupBy(value, 'type');
      const keys = uniq([...customizerKeys, ...Object.keys(links)]);
      const batches: MaybePromise<MaybeNullish<MaybeArray<Link>>>[] = keys.map((key) => {
        const keyedContext = {
          ...context,
          value: asMaybeArray(links[key]),
        } as PropertyExtractorContext<Context, MaybeNullish<MaybeArray<Link>>>;
        const keyedCustomizer = simplifiedCustomizer[key];
        return keyedCustomizer ? keyedCustomizer(keyedContext) : keyedContext.value;
      });

      return maybePromiseAll(batches, (batches) => compactArray(batches).flat());
    });
  };
}

function simplifyLinksMap<Context>(
  customizer: Record<string, KeyedLinkCustomizer<Context>>,
): Record<string, KeyedLinkExtractor<Context>> {
  return compactObject(mapValues(customizer, (value, key) => keyedLink<Context>(value, key)));
}
