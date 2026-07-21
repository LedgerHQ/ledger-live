import type { FeeStrategyOption } from "../hooks/useNetworkFeesCore";

export type FeeSelectorOptionKind = "preset" | "default" | "custom" | "coinControl";

export type FeeSelectorOption = Readonly<{
  id: string;
  kind: FeeSelectorOptionKind;
  label: string;
  sublabel: string | null;
  selected: boolean;
  onSelect: () => void;
}>;

/**
 * An appendable extra entry (custom fees / coin control). Declared unconditionally by the caller;
 * the builder appends it only when `enabled` and a handler are both present.
 */
export type FeeSelectorExtraAction = Readonly<{
  enabled: boolean;
  label: string;
  onSelect?: () => void;
}>;

export type BuildFeeSelectorOptionsParams = Readonly<{
  strategyOptions: readonly FeeStrategyOption[];
  selectedFeeStrategyId: string;
  onSelectFeeStrategyId: (id: string) => void;
  labelFor: (option: FeeStrategyOption) => string;
  sublabelFor: (option: FeeStrategyOption) => string | null;
  custom?: FeeSelectorExtraAction;
  coinControl?: FeeSelectorExtraAction;
}>;

/**
 * Shared desktop/mobile fee-selector list builder. Maps the core `feeStrategyOptions` to display
 * rows, then appends the custom / coin-control entries when they are enabled and wired. The two apps
 * differ only in how they label and sub-label a row (i18n namespace, legend-vs-fiat), passed as
 * `labelFor` / `sublabelFor` — the option shape and the custom/coin-control wiring stay identical.
 */
export function buildFeeSelectorOptions({
  strategyOptions,
  selectedFeeStrategyId,
  onSelectFeeStrategyId,
  labelFor,
  sublabelFor,
  custom,
  coinControl,
}: BuildFeeSelectorOptionsParams): FeeSelectorOption[] {
  const options: FeeSelectorOption[] = strategyOptions.map(option => ({
    id: option.id,
    kind: option.kind,
    label: labelFor(option),
    sublabel: sublabelFor(option),
    selected: option.id === selectedFeeStrategyId,
    onSelect: () => onSelectFeeStrategyId(option.id),
  }));

  if (custom?.enabled && custom.onSelect) {
    options.push({
      id: "custom",
      kind: "custom",
      label: custom.label,
      sublabel: null,
      selected: selectedFeeStrategyId === "custom",
      onSelect: custom.onSelect,
    });
  }

  if (coinControl?.enabled && coinControl.onSelect) {
    options.push({
      id: "coinControl",
      kind: "coinControl",
      label: coinControl.label,
      sublabel: null,
      selected: false,
      onSelect: coinControl.onSelect,
    });
  }

  return options;
}
