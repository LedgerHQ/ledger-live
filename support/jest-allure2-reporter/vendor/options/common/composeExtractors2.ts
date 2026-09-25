import type {
  MaybeNullish,
  PropertyExtractor,
  PropertyExtractorContext,
} from '@support/jest-allure2-reporter';

import { once } from '../../utils';

export function composeExtractors2<Context, Value, Result>(
  a: undefined | null,
  b: PropertyExtractor<Context, Value, Result>,
): typeof b;
export function composeExtractors2<Context, Value, Ra, Rb>(
  a: PropertyExtractor<Context, Rb, Ra>,
  b: PropertyExtractor<Context, Value, Rb>,
): PropertyExtractor<Context, Value, Ra>;
export function composeExtractors2<Context, Value, Ra, Rb>(
  a: MaybeNullish<PropertyExtractor<Context, Rb, Ra>>,
  b: PropertyExtractor<Context, Value, Rb>,
): PropertyExtractor<Context, Value, Ra | Rb>;
export function composeExtractors2<Context, Value, Ra, Rb>(
  a: MaybeNullish<PropertyExtractor<Context, Rb, Ra>>,
  b: PropertyExtractor<Context, Value, Rb>,
): PropertyExtractor<Context, Value, Ra | Rb> {
  if (!a) {
    return b;
  }

  return (context) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value, ...restContext } = context;
    const newContext = Object.defineProperty(restContext as {}, 'value', {
      get: once(getValueFromParent),
      enumerable: false,
    }) as PropertyExtractorContext<Context, Rb>;

    function getValueFromParent() {
      return b(context);
    }

    return a(newContext);
  };
}
