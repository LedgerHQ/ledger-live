import React from "react";

/**
 * Height the sheet footer occupies, in px, or `0` when the sheet has no footer.
 *
 * The footer is pinned over the bottom of the sheet, so content has to reserve this much room or
 * its last elements end up underneath it.
 */
export const BottomSheetFooterInsetContext = React.createContext(0);

/**
 * Room the sheet footer takes at the bottom of the content, to be applied as `paddingBottom` on the
 * scrollable or view holding the sheet content.
 *
 * Returns `0` outside a sheet and for sheets without a footer, so it is safe to add
 * unconditionally.
 */
export function useBottomSheetFooterInset(): number {
  return React.useContext(BottomSheetFooterInsetContext);
}
