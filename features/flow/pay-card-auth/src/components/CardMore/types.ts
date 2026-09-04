/** The four rows of the More sheet, in the order the design lists them. */
export type CardMoreRowId = "managePin" | "accessBaanx" | "help" | "logout";

export type CardMoreRow = Readonly<{
  id: CardMoreRowId;
  title: string;
  /**
   * Every row is pressable. Three of the four run a no-op until their own ticket lands, so the row
   * is real UI and not a disabled one.
   */
  onPress: () => void;
}>;

export type CardMoreSheetProps = Readonly<{
  isOpen: boolean;
  title: string;
  rows: readonly CardMoreRow[];
  onClose: () => void;
}>;

export type CardMoreViewProps = Readonly<{
  moreLabel: string;
  sheetTitle: string;
  rows: readonly CardMoreRow[];
  isSheetOpen: boolean;
  onMorePress: () => void;
  onSheetClose: () => void;
}>;

/** `null` means the component has nothing to show: nobody is signed in, or the user is still loading. */
export type CardMoreViewModel = CardMoreViewProps | null;
