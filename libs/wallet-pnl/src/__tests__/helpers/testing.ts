import { renderHook, type RenderHookResult } from "@testing-library/react";

export function render<TProps, TResult>(
  callback: (props: TProps) => TResult,
  initialProps: TProps,
): RenderHookResult<TResult, TProps> {
  return renderHook(callback, { initialProps });
}
