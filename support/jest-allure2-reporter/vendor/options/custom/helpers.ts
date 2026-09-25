import type { Helpers, HelpersCustomizer } from '@support/jest-allure2-reporter';

import type { HelpersExtractor } from '../types';

export function helpers(customizer: HelpersCustomizer | undefined): HelpersExtractor | undefined {
  if (customizer == null) {
    return undefined;
  }

  if (typeof customizer === 'function') {
    return customizer;
  }

  const customizedKeys = Object.keys(customizer) as (keyof Helpers)[];

  return (context) => {
    const base = { ...context.value };
    const baseKeys = Object.keys(base) as (keyof Helpers)[];
    const allKeys = new Set([...baseKeys, ...customizedKeys]);
    for (const key of allKeys) {
      if (customizer[key]) {
        const factory = customizer[key] as any;
        base[key] = factory({ ...context, value: context.$[key] });
      }
    }

    return base;
  };
}
