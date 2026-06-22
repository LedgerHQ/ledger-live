export const CONTEXT_MENU_VIEW = {
  myWallet: "myWallet",
  backupHub: "backupHub",
} as const;

export type ContextMenuView = (typeof CONTEXT_MENU_VIEW)[keyof typeof CONTEXT_MENU_VIEW];

export type NavDirection = "forward" | "back";

export type ContextMenuNavigation = {
  readonly view: ContextMenuView;
  readonly direction: NavDirection;
  readonly navigateTo: (view: ContextMenuView) => void;
  readonly goBack: () => void;
  readonly reset: () => void;
};

export type ContextMenuProviderValue = {
  readonly close: () => void;
  readonly view: ContextMenuView;
  readonly direction: NavDirection;
  readonly navigateTo: (view: ContextMenuView) => void;
  readonly goBack: () => void;
};

export type ContextMenuViewProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly contextValue: ContextMenuProviderValue;
};
