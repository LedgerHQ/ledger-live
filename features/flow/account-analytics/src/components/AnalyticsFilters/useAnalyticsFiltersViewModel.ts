import { useMemo } from "react";
import { track } from "@shared/analytics";
import {
  ACCOUNT_ANALYTICS_EVENTS,
  ACCOUNT_ANALYTICS_FILTERS,
  ALL_FILTER_VALUE,
  filterChangedProps,
  filterOpenedProps,
  type AccountAnalyticsFilter,
} from "../../tracking/accountAnalyticsTracking";
import type { AnalyticsFiltersProps } from "./AnalyticsFilters.types";
import type {
  AnalyticsFilterOptionMeta,
  AnalyticsFiltersViewProps,
  AnalyticsFilterViewProps,
} from "./AnalyticsFiltersView.types";

const ALL_OPTIONS = "";

type FilterOption = Readonly<{
  id: string;
  name: string;
  trackingValue: string;
  meta: AnalyticsFilterOptionMeta;
}>;

type FilterInput = Readonly<{
  options: readonly FilterOption[];
  selectedId: string | null;
  label: string;
  allLabel: string;
  disabled: boolean;
  tracking: AccountAnalyticsFilter;
  onSelect: (id: string | null) => void;
}>;

function toFilter({
  options,
  selectedId,
  label,
  allLabel,
  disabled,
  tracking,
  onSelect,
}: FilterInput): AnalyticsFilterViewProps {
  const selected = options.find(option => option.id === selectedId);
  const triggerLabel = selected?.name ?? allLabel;
  const trackingValueOf = (id: string | null) =>
    options.find(option => option.id === id)?.trackingValue ?? ALL_FILTER_VALUE;
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
    onOpenChange: open => {
      if (!open) return;
      track(ACCOUNT_ANALYTICS_EVENTS.buttonClicked, filterOpenedProps(tracking));
    },
    onValueChange: value => {
      const nextId = value === ALL_OPTIONS ? null : value;
      if (nextId === selectedId) return;
      track(
        ACCOUNT_ANALYTICS_EVENTS.filterChanged,
        filterChangedProps(tracking, trackingValueOf(nextId), trackingValueOf(selectedId)),
      );
      onSelect(nextId);
    },
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
          trackingValue: name,
          meta: { iconId, ticker },
        })),
        selectedId: assetId,
        label: labels.assets,
        allLabel: labels.allAssets,
        disabled: assets.length === 0,
        tracking: ACCOUNT_ANALYTICS_FILTERS.asset,
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
              trackingValue: networkName,
              meta: { iconId, ticker, networkName },
            })),
            selectedId: accountId,
            label: labels.accounts,
            allLabel: labels.allAccounts,
            disabled: false,
            tracking: ACCOUNT_ANALYTICS_FILTERS.account,
            onSelect: selectAccount,
          }),
    [accounts, assetId, accountId, labels.accounts, labels.allAccounts, selectAccount],
  );
  return { asset, account };
}
