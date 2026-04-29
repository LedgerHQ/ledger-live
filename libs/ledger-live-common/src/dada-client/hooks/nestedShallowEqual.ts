import { shallowEqual } from "react-redux";

/**
 * Two-level shallow equality for Record<string, object | primitive>.
 * Top-level keys are compared by count + presence, then each value is
 * compared with shallowEqual (which handles primitives and flat objects).
 *
 * This is needed because useSelector's default `===` and even `shallowEqual`
 * fail when selectors build new wrapper objects whose inner values are
 * structurally identical but referentially different.
 */
export function nestedShallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (a === b) return true;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!shallowEqual(a[key], b[key])) return false;
  }

  return true;
}
