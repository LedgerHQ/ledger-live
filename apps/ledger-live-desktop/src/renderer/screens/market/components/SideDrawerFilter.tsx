import React, { useCallback } from "react";
import { TFunction } from "i18next";
import Dropdown from "./DropDown";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";

export default function SideDrawerFilter({
  refresh,
  filters,
  t,
}: {
  refresh: (params: MarketListRequestParams) => void;
  filters: Record<"starred", { value: boolean; toggle: () => void; disabled?: boolean }>;
  t: TFunction;
}) {
  const { starred } = filters;

  const resetFilters = useCallback(() => refresh({ starred: [], liveCompatible: true }), [refresh]);
  const onChange = useCallback(
    (option?: { label: string; value: string } | null) => {
      if (!option) return;
      switch (option.value) {
        case "all":
          resetFilters();
          break;
        case "starred":
          starred.toggle();
          break;
      }
    },
    [resetFilters, starred],
  );

  const options = [
    {
      value: "all",
      label: t("market.filters.all"),
    },
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
        searchable={false}
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
