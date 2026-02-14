import React from "react";

const REACT_ELEMENT_TYPE = Symbol.for("react.element");
const REACT_TRANSITIONAL_ELEMENT_TYPE = Symbol.for("react.transitional.element");

/**
 * Checks whether a value is a React element.
 *
 * Handles both the classic `react.element` symbol used up to React 18 and the
 * `react.transitional.element` symbol introduced in React 19, making it safe
 * to use across major versions without relying on the legacy
 * `React.isValidElement` API.
 */
export const isValidReactElement = (value: unknown): value is React.ReactElement =>
  !!value &&
  typeof value === "object" &&
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  "$$typeof" in (value as Record<string, unknown>) &&
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ((value as { $$typeof?: unknown }).$$typeof === REACT_ELEMENT_TYPE ||
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (value as { $$typeof?: unknown }).$$typeof === REACT_TRANSITIONAL_ELEMENT_TYPE);
