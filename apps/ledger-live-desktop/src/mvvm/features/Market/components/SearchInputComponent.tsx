import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "LLD/components/Search";
import { track } from "~/renderer/analytics/segment";

type Props = {
  search: string;
  updateSearch: (value: string) => void;
};

function SearchInputComponent({ search, updateSearch }: Props) {
  const { t } = useTranslation();

  const [inputSearch, setInputSearch] = useState(search);
  const debouncedSearch = useDebounce(inputSearch, 300);

  useEffect(() => {
    track("Page Market Query", {
      currencyName: debouncedSearch,
    });
    updateSearch(debouncedSearch ? debouncedSearch.trim() : "");
  }, [debouncedSearch, updateSearch]);

  useEffect(() => {
    setInputSearch(search);
  }, [search]);

  return (
    <div className="mb-12 max-w-[350px] flex-auto pt-4">
      <Search
        autoFocus={false}
        value={inputSearch}
        placeholder={t("market.searchPlaceholder")}
        onChange={e => setInputSearch(e.target.value)}
        data-testid="market-search-input"
      />
    </div>
  );
}
export default React.memo(SearchInputComponent);
