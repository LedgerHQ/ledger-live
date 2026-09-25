import type {
  Link,
  LinksCustomizer,
  MaybeNullish,
  MaybePromise,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import * as extractors from '../../common';

import { linksMap } from './linksMap';

export function links<Context>(
  customizer: LinksCustomizer<Context>,
): PropertyExtractor<Context, MaybePromise<Link[]>>;
export function links<Context>(
  customizer: MaybeNullish<LinksCustomizer<Context>>,
): PropertyExtractor<Context, MaybePromise<Link[]>> | undefined;
export function links<Context>(
  customizer: MaybeNullish<LinksCustomizer<Context>>,
): PropertyExtractor<Context, MaybePromise<Link[]>> | undefined {
  if (customizer == null) {
    return;
  }

  if (typeof customizer === 'function') {
    return customizer;
  }

  if (Array.isArray(customizer)) {
    return extractors.appender(customizer);
  }

  return linksMap(customizer);
}
