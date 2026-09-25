import path from 'node:path';
import os from 'node:os';

import { state } from 'jest-metadata';
import type { AllureTestRunMetadata } from '@support/jest-allure2-reporter';

import type { SharedReporterConfig } from '../runtime';
import { AllureRuntimeImplementation, AllureRuntimeContext } from '../runtime';
import { AllureMetadataProxy } from '../metadata';

export class AllureRealm {
  runtimeContext = new AllureRuntimeContext({
    getCurrentMetadata: () => state.currentMetadata,
    getFileMetadata: () => state.lastTestFile!,
    getGlobalMetadata: () => state,
    getNow: () => Date.now(),
    getReporterConfig() {
      let config = new AllureMetadataProxy<AllureTestRunMetadata>(state).get('config');
      if (!config) {
        console.warn(
          "Cannot receive @support/jest-allure2-reporter's config from the parent process. Have you set up Jest test environment correctly?",
        );
      }

      config ??= {
        resultsDir: path.join(os.tmpdir(), 'allure-results'),
        overwrite: true,
        injectGlobals: true,
        attachments: {
          subDir: 'attachments',
          contentHandler: 'write',
          fileHandler: 'ref',
        },
      };

      return config as SharedReporterConfig;
    },
  });

  runtime = new AllureRuntimeImplementation(this.runtimeContext);
}
