import { createContext, useContext } from "react";

/** Identifies the enclosing sheet, so a field focused inside it can claim the keyboard. */
export const BottomSheetInstanceContext = createContext<string | null>(null);

export function useBottomSheetId(): string | null {
  return useContext(BottomSheetInstanceContext);
}
