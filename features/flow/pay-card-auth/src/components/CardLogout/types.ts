import type { CardMoreRow } from "../CardMore/types";

/**
 * The More tile-button, and the sheet it opens. The card holder's id and the verification state left
 * this component with LIVE-33835, because the design shows neither.
 */
export type CardLogoutViewProps = Readonly<{
  moreLabel: string;
  sheetTitle: string;
  rows: readonly CardMoreRow[];
  isSheetOpen: boolean;
  onMorePress: () => void;
  onSheetClose: () => void;
}>;

/** `null` means the component has nothing to show: nobody is signed in, or the user is still loading. */
export type CardLogoutViewModel = CardLogoutViewProps | null;
