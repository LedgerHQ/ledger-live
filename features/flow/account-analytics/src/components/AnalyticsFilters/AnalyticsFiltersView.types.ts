export type AnalyticsFilterOptionMeta = Readonly<{
  iconId: string;
  ticker: string;
  networkName?: string;
}>;

export type AnalyticsFilterOption = Readonly<{
  value: string;
  label: string;
  meta?: AnalyticsFilterOptionMeta;
}>;

export type AnalyticsFilterViewProps = Readonly<{
  ariaLabel: string;
  items: AnalyticsFilterOption[];
  value: string;
  triggerLabel: string;
  selectedMeta?: AnalyticsFilterOptionMeta;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string | null) => void;
}>;

export type AnalyticsFiltersViewProps = Readonly<{
  asset: AnalyticsFilterViewProps;
  account: AnalyticsFilterViewProps | null;
}>;
