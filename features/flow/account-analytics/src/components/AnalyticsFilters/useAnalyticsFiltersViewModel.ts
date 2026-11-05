import { useMemo } from "react";
import type { AnalyticsFiltersProps } from "./AnalyticsFilters.types";
import type {
  AnalyticsFilterOptionMeta,
  AnalyticsFiltersViewProps,
  AnalyticsFilterViewProps,
} from "./AnalyticsFiltersView.types";

const ALL_OPTIONS = "";

type FilterOption = Readonly<{ id: string; name: string; meta: AnalyticsFilterOptionMeta }>;

type FilterInput = Readonly<{
  options: readonly FilterOption[];
  selectedId: string | null;
  label: string;
  allLabel: string;
  disabled: boolean;
  onSelect: (id: string | null) => void;
}>;

function toFilter({
  options,
  selectedId,
  label,
  allLabel,
  disabled,
  onSelect,
}: FilterInput): AnalyticsFilterViewProps {
  const selected = options.find(option => option.id === selectedId);
  const triggerLabel = selected?.name ?? allLabel;
  return {
    ariaLabel: `${label}, ${triggerLabel}`,
    items: [
      { value: ALL_OPTIONS, label: allLabel },
      ...options.map(option => ({ value: option.id, label: option.name, meta: option.meta })),
    ],
    value: selectedId ?? ALL_OPTIONS,
    triggerLabel,
    selectedMeta: selected?.meta,
    disabled,
    onValueChange: value => onSelect(value || null),
  };
}

export function useAnalyticsFiltersViewModel({
  assets,
  accounts,
  selection: { assetId, accountId },
  labels,
  selectAsset,
  selectAccount,
}: AnalyticsFiltersProps): AnalyticsFiltersViewProps {
  const asset = useMemo(
    () =>
      toFilter({
        options: assets.map(({ id, name, iconId, ticker }) => ({
          id,
          name,
          meta: { iconId, ticker },
        })),
        selectedId: assetId,
        label: labels.assets,
        allLabel: labels.allAssets,
        disabled: assets.length === 0,
        onSelect: selectAsset,
      }),
    [assets, assetId, labels.assets, labels.allAssets, selectAsset],
  );
  const account = useMemo(
    () =>
      assetId === null
        ? null
        : toFilter({
            options: accounts.map(({ id, name, iconId, ticker, networkName }) => ({
              id,
              name,
              meta: { iconId, ticker, networkName },
            })),
            selectedId: accountId,
            label: labels.accounts,
            allLabel: labels.allAccounts,
            disabled: false,
            onSelect: selectAccount,
          }),
    [accounts, assetId, accountId, labels.accounts, labels.allAccounts, selectAccount],
  );
  return { asset, account };
}
