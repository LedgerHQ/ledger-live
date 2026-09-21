export type MoreRowId = "managePin" | "accessBaanx" | "help" | "logout";

/** The three redirect actions a host wires from its own resolved URLs; they always travel together. */
export type CardSettingsActions = Readonly<{
  onManagePin?: () => void;
  onAccessBaanx?: () => void;
  onHelp?: () => void;
}>;

export type MoreRow = Readonly<{
  id: MoreRowId;
  title: string;
  onPress: () => void;
}>;

export type MoreSheetProps = Readonly<{
  isOpen: boolean;
  title: string;
  rows: readonly MoreRow[];
  onClose: () => void;
}>;

export type MoreViewProps = Readonly<{
  moreLabel: string;
  sheetTitle: string;
  rows: readonly MoreRow[];
  isSheetOpen: boolean;
  onMorePress: () => void;
  onSheetClose: () => void;
}>;

/** `null` means the component has nothing to show: nobody is signed in, or the user is still loading. */
export type MoreViewModel = MoreViewProps | null;
