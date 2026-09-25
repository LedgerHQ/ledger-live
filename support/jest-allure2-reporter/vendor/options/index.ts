import type { ReporterOptions } from '@support/jest-allure2-reporter';

import { asArray, importFrom } from '../utils';

import { testCaseSteps } from './custom';
import { defaultOptions } from './default';
import { extendOptions } from './extendOptions';
import type { ReporterConfig } from './types';
import { combineTestCaseAndSteps } from './combineTestCaseAndSteps';

export async function resolveOptions(
  rootDirectory: string,
  custom?: ReporterOptions | undefined,
): Promise<ReporterConfig<void>> {
  const extensions = custom ? await resolveExtendsChain(rootDirectory, custom) : [];

  let config: ReporterConfig = defaultOptions();
  for (const extension of extensions) {
    config = extendOptions(config, extension);
  }

  config.testFile = combineTestCaseAndSteps(
    config.testFile,
    testCaseSteps(config.testStep, 'testFileMetadata'),
  );
  config.testCase = combineTestCaseAndSteps(
    config.testCase,
    testCaseSteps(config.testStep, 'testCaseMetadata'),
  );
  config.testRun = combineTestCaseAndSteps(
    config.testRun,
    testCaseSteps(config.testStep, 'testRunMetadata'),
  );

  return config as ReporterConfig<void>;
}

export async function resolveExtendsChain(
  rootDirectory: string,
  custom: ReporterOptions | undefined,
): Promise<ReporterOptions[]> {
  if (custom) {
    const chain: ReporterOptions[] = [custom];
    for (const reference of asArray(custom.extends)) {
      const resolution =
        typeof reference === 'string'
          ? await importFrom(reference, rootDirectory)
          : { dirname: rootDirectory, exports: reference };
      chain.unshift(...(await resolveExtendsChain(resolution.dirname, resolution.exports)));
    }
    return chain;
  }

  return [];
}

export { resolveWriter } from './resolveWriter';

export { ReporterConfig } from './types';
