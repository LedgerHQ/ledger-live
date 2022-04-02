import { SearchInput } from "@ledgerhq/native-ui";
import React, { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { track } from "../../analytics";

type Props = {
  search?: string;
  refresh: (params: any) => void;
};

function SearchHeader({ search, refresh }: Props) {
  const [inputSearch, setInputSearch] = useState(search);
  const { t } = useTranslation();

  const onSubmit = useCallback(() => {
    if (inputSearch !== search) {
      track("Page Market Query", {
        currencyName: inputSearch,
      });
      refresh({
        search: inputSearch ? inputSearch.trim() : "",
        starred: [],
        liveCompatible: false,
      });
    }
  }, [inputSearch, search, refresh]);

  return (
    <SearchInput
      value={inputSearch}
      onChange={setInputSearch}
      onSubmitEditing={onSubmit}
      onEndEditing={onSubmit}
      placeholder={t("common.search")}
    />
  );
}

export default memo<Props>(SearchHeader);
