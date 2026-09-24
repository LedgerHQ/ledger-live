/**
 * Small string helpers. Internal: not re-exported from the package barrel.
 */

/**
 * Drop trailing `char`s.
 *
 * Deliberately not a regex. `/\/+$/` and `/=+$/` are polynomial patterns on
 * input with long runs of the trimmed character (CodeQL flags them as a ReDoS
 * shape); a loop is linear and clearer.
 */
export function trimTrailing(value: string, char: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === char) end -= 1;
  return value.slice(0, end);
}
