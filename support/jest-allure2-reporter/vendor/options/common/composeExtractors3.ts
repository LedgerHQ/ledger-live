import type { PropertyExtractor } from '@support/jest-allure2-reporter';

import { composeExtractors2 } from './composeExtractors2';

export function composeExtractors3<Context, V, Rc, Rb = Rc, Ra = V>(
  a: PropertyExtractor<Context, Rb, Ra>,
  b: PropertyExtractor<Context, Rc, Rb>,
  c: PropertyExtractor<Context, V, Rc>,
): PropertyExtractor<Context, V, Ra> {
  const ab = composeExtractors2(a, b);
  return composeExtractors2(ab, c);
}
