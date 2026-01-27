import React, { useCallback } from "react";
import { TFunction } from "i18next";
import Dropdown from "./DropDown";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

export default function SideDrawerFilter({
  refresh,
  filters,
  t,
}: {
  refresh: (params: MarketListRequestParams) => void;
  filters: Record<
    "starred" | "liveCompatible",
    { value: boolean; toggle: () => void; disabled?: boolean }
  >;
  t: TFunction;
}) {
  const { starred, liveCompatible } = filters;

  const { shouldDisplayMarketBanner: filterBySupported } = useWalletFeaturesConfig("desktop");

  const shouldDisplayCompatibleOption = !filterBySupported;

  const resetFilters = useCallback(
    () => refresh({ starred: [], liveCompatible: filterBySupported }),
    [refresh, filterBySupported],
  );
  const onChange = useCallback(
    (option?: { label: string; value: string } | null) => {
      if (!option) return;
      switch (option.value) {
        case "all":
          resetFilters();
          break;
        case "liveCompatible":
          liveCompatible.toggle();
          break;
        case "starred":
          starred.toggle();
          break;
      }
    },
    [liveCompatible, resetFilters, starred],
  );

  const options = [
    {
      value: "all",
      label: t("market.filters.all"),
    },
    ...(shouldDisplayCompatibleOption
      ? [
          {
            value: "liveCompatible",
            label: t("market.filters.isLedgerCompatible"),
          },
        ]
      : []),
    {
      value: "starred",
      label: t("market.filters.isFavorite"),
    },
  ];

  return (
    <>
      <Dropdown
        data-testid="market-filter-drawer-button"
        label={t("market.filters.show")}
        menuPortalTarget={document.body}
        onChange={onChange}
        options={options}
        value={[
          ...(!starred.value && !liveCompatible.value
            ? [
                {
                  value: "all",
                  label: t("market.filters.all"),
                },
              ]
            : []),
          ...(shouldDisplayCompatibleOption && liveCompatible.value
            ? [
                {
                  value: "liveCompatible",
                  label: t("market.filters.isLedgerCompatible"),
                },
              ]
            : []),
          ...(starred.value
            ? [
                {
                  value: "starred",
                  label: t("market.filters.isFavorite"),
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
