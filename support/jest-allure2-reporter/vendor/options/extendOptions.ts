import path from 'node:path';

import type { ReporterOptions } from '@support/jest-allure2-reporter';

import * as customizers from './custom';
import * as extractors from './common';
import type { ReporterConfig, SourceCodeProcessorConfig } from './types';

export function extendOptions(
  base: ReporterConfig,
  custom?: ReporterOptions | undefined,
): ReporterConfig {
  return {
    overwrite: custom?.overwrite ?? base.overwrite,
    resultsDir: path.resolve(custom?.resultsDir ?? base.resultsDir),
    injectGlobals: custom?.injectGlobals ?? base.injectGlobals,
    attachments: {
      subDir: custom?.attachments?.subDir ?? base.attachments.subDir,
      contentHandler: custom?.attachments?.contentHandler ?? base.attachments.contentHandler,
      fileHandler: custom?.attachments?.fileHandler ?? base.attachments.fileHandler,
    },
    sourceCode: custom?.sourceCode
      ? mergeSourceCodeConfigs(base.sourceCode, customizers.sourceCode(custom.sourceCode))
      : base.sourceCode,
    categories: extractors.compose2(extractors.appender(custom?.categories), base.categories),
    environment: extractors.compose2(extractors.merger(custom?.environment, {}), base.environment),
    executor: extractors.compose2(extractors.merger(custom?.executor, {}), base.executor),
    helpers: extractors.compose2(customizers.helpers(custom?.helpers), base.helpers),
    testRun: extractors.compose2(customizers.testCase(custom?.testRun), base.testRun),
    testFile: extractors.compose2(customizers.testCase(custom?.testFile), base.testFile),
    testCase: extractors.compose2(customizers.testCase(custom?.testCase), base.testCase),
    testStep: extractors.compose2(customizers.testStep(custom?.testStep), base.testStep),
    writer: custom?.writer ?? base.writer,
  };
}

function mergeSourceCodeConfigs(
  base: SourceCodeProcessorConfig,
  custom: SourceCodeProcessorConfig,
): SourceCodeProcessorConfig {
  return {
    enabled: custom.enabled ?? base.enabled,
    factories: { ...base.factories, ...custom.factories },
    options: { ...base.options, ...custom.options },
    // This field is populated by the reporter itself
    plugins: base.plugins,
  };
}
