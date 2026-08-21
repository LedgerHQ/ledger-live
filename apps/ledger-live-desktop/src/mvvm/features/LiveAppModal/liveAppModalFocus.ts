export function capturePreviouslyFocusedElement(activeElement: Element | null): HTMLElement | null {
  return activeElement instanceof HTMLElement ? activeElement : null;
}

export function restorePreviouslyFocusedElement(element: HTMLElement | null): void {
  if (element?.isConnected) {
    element.focus();
  }
}
