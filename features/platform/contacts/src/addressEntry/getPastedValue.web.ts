import type { ClipboardEvent } from "react";

export function getPastedValue(value: string, event: ClipboardEvent<HTMLInputElement>): string {
  const input = event.currentTarget;
  const pastedText = event.clipboardData.getData("text/plain");
  const selectionStart = input.selectionStart ?? value.length;
  const selectionEnd = input.selectionEnd ?? value.length;

  return `${value.slice(0, selectionStart)}${pastedText}${value.slice(selectionEnd)}`;
}
