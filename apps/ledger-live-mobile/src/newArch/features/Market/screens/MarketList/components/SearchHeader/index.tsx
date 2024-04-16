import { SearchInput } from "@ledgerhq/native-ui";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import React, { memo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { track } from "~/analytics";

type Props = {
  search?: string;
  refresh: (params: MarketListRequestParams) => void;
};

function SearchHeader({ search, refresh }: Props) {
  const [inputSearch, setInputSearch] = useState(search);
  const debouncedSearch = useDebounce(inputSearch, 300);
  const { t } = useTranslation();

  useEffect(() => {
    track("Page Market Query", {
      currencyName: debouncedSearch,
    });
    refresh({
      search: debouncedSearch ? debouncedSearch.trim() : "",
      starred: [],
      liveCompatible: false,
      limit: 20,
    });
  }, [debouncedSearch, refresh]);

  useEffect(() => {
    setInputSearch(search);
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
