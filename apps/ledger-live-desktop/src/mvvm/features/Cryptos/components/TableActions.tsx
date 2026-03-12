import React from "react";
import { SearchInput, Button } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";
import { ButtonDropdownSelector } from "LLD/components/ButtonDropdownSelector";
import { useTableActionsViewModel } from "../hooks/useTableActionsViewModel";

type TableActionsProps = {
  searchValue: string;
  setSearchValue: (value: string) => void;
};

export default function TableActions({ searchValue, setSearchValue }: TableActionsProps) {
  const {
    t,
    handleAddAddressClick,
    orderItems,
    orderValue,
    onOrderChange,
    filterItems,
    filterValue,
    onFilterChange,
  } = useTableActionsViewModel({ searchValue, setSearchValue });

  return (
    <div className="my-2 flex flex-row items-center justify-between pr-[6px]">
      <div className="max-w-[350px] flex-auto pt-4">
        <SearchInput
          value={searchValue}
          placeholder={t("cryptos.tableActions.searchAddress")}
          onChange={e => setSearchValue(e.target.value)}
        />
      </div>
      <div className="flex flex-row items-center gap-8">
        <Button
          appearance="base"
          size="sm"
          icon={Plus}
          onClick={handleAddAddressClick}
          data-testid="cryptos-add-address-button"
        >
          {t("cryptos.tableActions.addAddress")}
        </Button>
        <ButtonDropdownSelector
          buttonId="cryptos-order-select"
          items={orderItems}
          onChange={onOrderChange}
          value={orderValue}
        />
        <ButtonDropdownSelector
          buttonId="cryptos-filter-select"
          items={filterItems}
          onChange={onFilterChange}
          value={filterValue}
        />
      </div>
    </div>
  );
}
