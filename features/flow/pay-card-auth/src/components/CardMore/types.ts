export type CardMoreRowId = "managePin" | "accessBaanx" | "help" | "logout";

export type CardMoreRow = Readonly<{
  id: CardMoreRowId;
  title: string;
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
