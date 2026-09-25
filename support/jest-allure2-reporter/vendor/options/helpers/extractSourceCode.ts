import type {
  AllureTestItemSourceLocation,
  ExtractSourceCodeHelperResult,
  KeyedHelperCustomizer,
} from '@support/jest-allure2-reporter';

import { log } from '../../logger';
import { defaults, isEmpty } from '../../utils';
import type { ReporterConfig } from '../types';

export const extractSourceCode: KeyedHelperCustomizer<'extractSourceCode'> = ({
  reporterConfig,
}) => {
  const config = reporterConfig as ReporterConfig;

  return async function extractSourceCodeHelper(
    location: AllureTestItemSourceLocation,
    includeComments = false,
  ): Promise<ExtractSourceCodeHelperResult | undefined> {
    if (isEmpty(location)) {
      return undefined;
    }

    const plugins = config.sourceCode ? Object.values(config.sourceCode.plugins) : [];

    let result: ExtractSourceCodeHelperResult = {};

    for (const p of plugins) {
      try {
        result = defaults(result, await p.extractSourceCode?.(location, includeComments));
      } catch (error: unknown) {
        log.warn(
          error,
          `Plugin "${p.name}" failed to extract source code for ${location.fileName}:${location.lineNumber}:${location.columnNumber}`,
        );
      }
      if (result?.code) {
        break;
      }
    }

    return isEmpty(result) ? undefined : result;
  };
};
