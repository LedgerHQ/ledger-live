import type React from "react";

/**
 * Carries a sheet's footer content to the slot gorhom renders it in.
 *
 * Context cannot do this. `BottomSheetModal` teleports its subtree through `@gorhom/portal`, which
 * re-renders it under a host mounted above the app, so a provider around the sheet is not an
 * ancestor of the footer and the slot only ever reads the default value.
 *
 * A ref cannot do it either: gorhom memoizes the footer container on the footer component's
 * identity, which has to stay stable to avoid remounting the footer on every render. Nothing would
 * re-render the slot when the content changed, so changes have to be published.
 */
export type FooterContentStore = Readonly<{
  subscribe: (listener: () => void) => () => void;
  getContent: () => React.ReactNode;
  setContent: (content: React.ReactNode) => void;
}>;

export function createFooterContentStore(): FooterContentStore {
  let content: React.ReactNode = null;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getContent() {
      return content;
    },
    setContent(next) {
      if (next === content) return;

      content = next;
      for (const listener of listeners) listener();
    },
  };
}
