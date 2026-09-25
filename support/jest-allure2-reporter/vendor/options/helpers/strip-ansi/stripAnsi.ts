import stripAnsiString from 'strip-ansi';

export function stripAnsi<T>(value: T): T {
  if (typeof value === 'string') {
    return stripAnsiString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map(stripAnsi) as T;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).reduce(
      (object, [key, value_]) => {
        object[key] = stripAnsi(value_);
        return object;
      },
      {} as Record<string, unknown>,
    ) as T;
  }

  return value;
}
