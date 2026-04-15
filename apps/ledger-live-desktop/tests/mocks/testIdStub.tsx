import { createElement, type ReactElement, type ReactNode } from "react";

/**
 * Minimal component stub for `jest.mock` factories: a div with `data-testid`
 * plus optional mapped props (e.g. `variant`, `location`) and `children`.
 */
export function testIdStub(
  testId: string,
  mapExtra?: (props: Record<string, unknown>) => ReactNode,
): (props: Record<string, unknown>) => ReactElement {
  return (props: Record<string, unknown>) =>
    createElement("div", { "data-testid": testId }, mapExtra?.(props), props.children as ReactNode);
}
