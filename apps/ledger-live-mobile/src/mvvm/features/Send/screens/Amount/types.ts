export type AmountScreenMessage = Readonly<{
  type: "error" | "warning" | "info";
  error: Error;
}>;

export type AmountScreenQuickAction = Readonly<{
  id: string;
  label: string;
  onPress: () => void;
  active: boolean;
  disabled: boolean;
}>;

export type FeePresetOption = Readonly<{
  id: string;
  label: string;
  fiatValue: string | null;
  legendValue: string | null;
}>;

export type AmountInputViewModel = Readonly<{
  value: string;
  currencyText: string;
  currencyPosition: "left" | "right";
  secondaryValue: string;
  maxDecimalLength: number;
  isDisabled: boolean;
  isTyping: boolean;
  onChangeText: (text: string) => void;
  onToggleMode: () => void;
}>;

export type NetworkFeesViewModel = Readonly<{
  label: string;
  value: string;
  strategyLabel: string;
  showFeePresets: boolean;
  selectedFeeStrategy: string | null;
  feePresetOptions: readonly FeePresetOption[];
  onSelectFeeStrategy: (strategy: string) => void;
  uiConfig?: Readonly<{
    hasCustomFees: boolean;
    hasCoinControl: boolean;
  }>;
}>;

export type QuickActionsViewModel = Readonly<{
  actions: readonly AmountScreenQuickAction[];
  show: boolean;
}>;

export type ReviewButtonViewModel = Readonly<{
  label: string;
  showIcon: boolean;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}>;

type AmountScreenViewModelReady = Readonly<{
  ready: true;
  amountInput: AmountInputViewModel;
  networkFees: NetworkFeesViewModel;
  quickActions: QuickActionsViewModel;
  reviewButton: ReviewButtonViewModel;
  message: AmountScreenMessage | null;
}>;

type AmountScreenViewModelNotReady = Readonly<{ ready: false }>;

export type AmountScreenViewModel = AmountScreenViewModelReady | AmountScreenViewModelNotReady;
