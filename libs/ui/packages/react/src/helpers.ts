import React from "react";

const REACT_ELEMENT_TYPE = Symbol.for("react.element");
const REACT_TRANSITIONAL_ELEMENT_TYPE = Symbol.for("react.transitional.element");

/**
 * Checks whether a value is a React element.
 *
 * Handles the React 19 `react.transitional.element` symbol (and the classic
 * `react.element` symbol for compatibility), making it safe to use without
 * relying on the legacy `React.isValidElement` API.
 */
export const isValidReactElement = (value: unknown): value is React.ReactElement =>
  !!value &&
  typeof value === "object" &&
  "$$typeof" in (value as Record<string, unknown>) &&
  ((value as { $$typeof?: unknown }).$$typeof === REACT_ELEMENT_TYPE ||
    (value as { $$typeof?: unknown }).$$typeof === REACT_TRANSITIONAL_ELEMENT_TYPE);
