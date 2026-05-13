export type ContextMenuProviderValue = {
  readonly close: () => void;
};

export type ContextMenuViewProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly contextValue: ContextMenuProviderValue;
};
