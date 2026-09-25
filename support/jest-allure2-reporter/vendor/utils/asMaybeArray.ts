import type { MaybeArray, MaybeNullish } from '@support/jest-allure2-reporter';

export function asMaybeArray<T>(value: MaybeNullish<MaybeArray<T>>): MaybeNullish<MaybeArray<T>> {
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.length === 1) return value[0];
    return value;
  }

  return value;
}
