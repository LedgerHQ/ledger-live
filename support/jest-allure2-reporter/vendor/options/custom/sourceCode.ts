import type { SourceCodePluginCustomizer, SourceCodeProcessorOptions } from '@support/jest-allure2-reporter';

import type { SourceCodeProcessorConfig } from '../types';

export function sourceCode(user: SourceCodeProcessorOptions): SourceCodeProcessorConfig {
  const factories: SourceCodeProcessorConfig['factories'] = {};
  const options: SourceCodeProcessorConfig['options'] = {};

  if (user.plugins) {
    for (const [key, value] of Object.entries(user.plugins)) {
      if (typeof value === 'function') {
        factories[key] = value as SourceCodePluginCustomizer;
      } else if (Array.isArray(value)) {
        factories[key] = value[0] as SourceCodePluginCustomizer;
        options[key] = value[1];
      } else {
        options[key] = value;
      }
    }
  }

  return {
    enabled: user.enabled ?? true,
    factories,
    options,
    plugins: [],
  };
}
