import importFrom from 'import-from';
import type { AllureWriter } from 'allure-store';

import type { ReporterConfig } from './types';

export async function resolveWriter(
  rootDirectory: string,
  config: ReporterConfig,
): Promise<AllureWriter> {
  let result: AllureWriter | undefined;
  const writerOption = config.writer;

  let WriterImpl = writerOption;
  let customOptions = {};

  // Handle array pattern [WriterImpl, customOptions]
  if (Array.isArray(writerOption)) {
    [WriterImpl, customOptions = {}] = writerOption;
  }

  if (typeof WriterImpl === 'string') {
    const imported = importFrom(rootDirectory, WriterImpl);
    WriterImpl = (imported as any)?.default || imported;
  }

  // If it's a function/constructor
  if (isMaybeClass<AllureWriter>(WriterImpl)) {
    try {
      result = await WriterImpl(config, customOptions);
    } catch (constructorError: any) {
      try {
        result = new WriterImpl(config, customOptions);
      } catch (factoryError: any) {
        throw new Error(
          `Failed to instantiate AllureWriter: ${constructorError?.message || constructorError}. ` +
            `Also failed as factory: ${factoryError?.message || factoryError}`,
        );
      }
    }
  }

  result ??= WriterImpl as unknown as AllureWriter;

  if (result == null) {
    throw new TypeError('AllureWriter implementation is undefined or null');
  }

  if (typeof result !== 'object') {
    throw new TypeError(
      'AllureWriter implementation must be a class or function, but got: ' + result,
    );
  }

  const missingMethods = findMissingMethods(result);
  if (missingMethods.length > 0) {
    throw new TypeError(
      `AllureWriter implementation is missing required methods: ${missingMethods.join(', ')}`,
    );
  }

  return result;
}

const REQUIRED_METHODS = [
  'writeCategories',
  'writeEnvironmentInfo',
  'writeExecutorInfo',
  'writeContainer',
  'writeResult',
] as Array<keyof AllureWriter>;

function findMissingMethods(object: Partial<AllureWriter> | undefined): (keyof AllureWriter)[] {
  if (!object || typeof object !== 'object') {
    return [...REQUIRED_METHODS];
  }

  return REQUIRED_METHODS.filter((key) => {
    const hopefullyFunction = object[key];
    return typeof hopefullyFunction !== 'function';
  });
}

function isMaybeClass<T>(
  value: unknown,
): value is { new (...arguments_: unknown[]): T; (...arguments_: unknown[]): Promise<T> } {
  return typeof value === 'function';
}
