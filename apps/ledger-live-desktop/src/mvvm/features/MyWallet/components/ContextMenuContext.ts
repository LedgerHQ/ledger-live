import { createContext, useContext } from "react";

type ContextMenuContextValue = {
  close: () => void;
};

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

/**
 * Returns the `close` function from the nearest ContextMenu provider.
 * Call it from any child inside the popover to dismiss the menu after an action.
 */
export function useContextMenuClose() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error("useContextMenuClose must be used within a ContextMenu");
  }
  return ctx.close;
}

export default ContextMenuContext;
