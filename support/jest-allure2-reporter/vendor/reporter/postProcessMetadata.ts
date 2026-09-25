import type {
  AllureTestItemMetadata,
  GlobalExtractorContext,
  DocblockExtractionContext,
} from '@support/jest-allure2-reporter';
import type { TestInvocationMetadata } from 'jest-metadata';

import { AllureMetadataProxy } from '../metadata';
import type { ReporterConfig } from '../options';
import { log } from '../logger';
import { compactObject, isEmpty } from '../utils';

const isNotProcessed = (() => {
  const set = new WeakSet();
  return (metadata: object) => {
    if (set.has(metadata)) {
      return false;
    }
    set.add(metadata);
    return true;
  };
})();

export async function postProcessMetadata(
  globalContext: GlobalExtractorContext,
  testInvocation: TestInvocationMetadata,
) {
  const config = globalContext.reporterConfig as ReporterConfig;
  if (!config.sourceCode.enabled) {
    return;
  }

  const batch = [
    ...testInvocation.allAncestors(),
    testInvocation,
    ...testInvocation.allInvocations(),
  ].filter(isNotProcessed);

  await Promise.all(
    batch.map(async (metadata) => {
      const allureProxy = new AllureMetadataProxy<AllureTestItemMetadata>(metadata);
      const context: DocblockExtractionContext = compactObject({
        ...allureProxy.get('sourceLocation'),
        transformedCode: allureProxy.get('transformedCode'),
      });

      if (!isEmpty(context)) {
        for (const p of config.sourceCode.plugins) {
          try {
            const docblock = await p.extractDocblock?.(context);
            if (docblock) {
              allureProxy.assign({ docblock });
              break;
            }
          } catch (error: unknown) {
            log.warn(
              error,
              `Plugin "${p.name}" failed to extract docblock for ${context.fileName}:${context.lineNumber}:${context.columnNumber}`,
            );
          }
        }
      }
    }),
  );
}
