import { SearchInput } from "@ledgerhq/native-ui";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import React, { memo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { track } from "~/analytics";
import { LIMIT } from "~/reducers/market";

type Props = {
  search?: string;
  updateMarketParams: (params: MarketListRequestParams) => void;
};

function SearchHeader({ search, updateMarketParams }: Props) {
  const [inputSearch, setInputSearch] = useState(search);
  const debouncedSearch = useDebounce(inputSearch, 300);
  const { t } = useTranslation();
  const prevSearchRef = useRef(search);

  useEffect(() => {
    track("Page Market Query", {
      currencyName: debouncedSearch,
    });
    updateMarketParams({
      search: debouncedSearch ? debouncedSearch.trim() : "",
      starred: [],
      liveCompatible: false,
      limit: LIMIT,
    });
  }, [debouncedSearch, updateMarketParams]);

  useEffect(() => {
    // Only sync when search prop is externally reset (e.g. via "Clear" button)
    // Detect this by checking if search changed FROM non-empty TO empty
    if (!!prevSearchRef.current && !search) {
      setInputSearch(search);
    }
    prevSearchRef.current = search;
  }, [search]);

  return (
    <SearchInput
      testID="search-box"
      value={inputSearch ?? ""}
      onChange={setInputSearch}
      placeholder={t("common.search")}
    />
  );
}

export default memo<Props>(SearchHeader);
