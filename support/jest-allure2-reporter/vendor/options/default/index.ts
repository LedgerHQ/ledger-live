import { FileAllureWriter } from 'allure-store';

import { log } from '../../logger';
import * as sourceCode from '../../source-code';
import type { ReporterConfig } from '../types';
import * as common from '../common';
import * as custom from '../custom';
import * as helpers from '../helpers';

import { categories } from './categories';
import { testRun } from './testRun';
import { testFile } from './testFile';
import { testCase } from './testCase';
import { testStep } from './testStep';

export function defaultOptions(): ReporterConfig {
  return {
    overwrite: true,
    resultsDir: 'allure-results',
    injectGlobals: true,
    attachments: {
      subDir: 'attachments',
      contentHandler: 'write',
      fileHandler: 'ref',
    },
    sourceCode: custom.sourceCode({
      enabled: true,
      plugins: sourceCode,
    }),
    helpers: custom.helpers(helpers)!,
    testRun: custom.testCase(testRun),
    testFile: custom.testCase(testFile),
    testCase: custom.testCase(testCase),
    testStep: custom.testStep(testStep),
    categories: common.constant(categories),
    environment: () => ({}),
    executor: () => ({}),
    writer: (config: ReporterConfig) =>
      new FileAllureWriter({
        resultsDirectory: config.resultsDir,
        overwrite: config.overwrite,
        onError: (error) => log.error(error, 'Caught an error in FileAllureWriter'),
      }),
  };
}
