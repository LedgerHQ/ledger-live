import type { PromisedProperties } from '@support/jest-allure2-reporter';

export async function resolvePromisedProperties<T>(
  maybePromised: PromisedProperties<T>,
): Promise<T> {
  const promised = await maybePromised;
  const entries = Object.entries(promised);
  const resolvedEntries = await Promise.all(
    entries.map(async ([key, value]) => [key, await value]),
  );
  return Object.fromEntries(resolvedEntries);
}
