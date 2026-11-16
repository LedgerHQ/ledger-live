export type SwapWallet40RouteName =
  | "home"
  | "quotesList"
  | "multiStepTransaction"
  | "devSettings"
  | "unknown";

export type SwapWallet40HeaderStyle = "transparent" | "opaque";

export type SwapWallet40HeaderTitleKey =
  | "transfer.swap2.quotesList.title"
  | "transfer.swap2.twoStepApproval.title"
  | "transfer.swap2.twoStepApproval.completedTitle"
  | "Dev Settings"
  | null;

export type SwapWallet40ParsedRoute = {
  routeName: SwapWallet40RouteName;
  headerStyle: SwapWallet40HeaderStyle;
  titleKey: SwapWallet40HeaderTitleKey;
  isTransactionComplete: boolean;
};

export type SwapWallet40HeaderState = {
  routeName: SwapWallet40RouteName;
  headerStyle: SwapWallet40HeaderStyle;
  titleKey: SwapWallet40HeaderTitleKey;
  canGoBack: boolean;
  isTransactionComplete: boolean;
};
