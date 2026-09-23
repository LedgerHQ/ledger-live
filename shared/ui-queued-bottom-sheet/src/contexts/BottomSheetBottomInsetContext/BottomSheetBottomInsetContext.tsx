import React from "react";

export const BottomSheetBottomInsetContext = React.createContext(0);

/**
 * Bottom safe area the sheet leaves for its content, in px, to add to the `paddingBottom` the
 * design asks for. `0` outside a sheet and wherever the sheet already covers the area itself.
 */
export function useBottomSheetBottomInset(): number {
  return React.useContext(BottomSheetBottomInsetContext);
}
