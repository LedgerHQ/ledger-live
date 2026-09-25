import type {
  MaybeArray,
  MaybeNullish,
  MaybePromise,
  PropertyCustomizer,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import { asArray, thruMaybePromise } from '../../utils';

import { composeExtractors2 } from './composeExtractors2';
import { isExtractor } from './isExtractor';

export function appenderExtractor<Context, R>(
  maybeExtractor: PropertyCustomizer<Context, R[], MaybeNullish<MaybeArray<R>>>,
): PropertyExtractor<Context, MaybePromise<R[]>> | undefined {
  if (maybeExtractor == null) {
    return;
  }

  if (isExtractor<Context, MaybePromise<R[]>, MaybeNullish<MaybeArray<R>>>(maybeExtractor)) {
    return composeExtractors2(
      ({ value }) => thruMaybePromise<MaybeNullish<MaybeArray<R>>, R[]>(value, asArray),
      maybeExtractor,
    );
  }

  const value = Array.isArray(maybeExtractor) ? maybeExtractor : [maybeExtractor as R];
  return (context) => {
    return thruMaybePromise(context.value, (base) => [...base, ...value]);
  };
}
