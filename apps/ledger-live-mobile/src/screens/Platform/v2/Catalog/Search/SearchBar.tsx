import { Flex, SearchInput } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { Search } from "../../types";

export function SearchBar({
  search: { input, inputRef, onChange, onFocus },
}: {
  search: Pick<Search, "input" | "inputRef" | "onChange" | "onFocus">;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Flex backgroundColor="background.main" marginBottom={16} flexDirection={"row"} zIndex={10}>
        <SearchInput
          containerStyle={{
            flexGrow: 1,
            width: 100,
          }}
          testID="platform-catalog-search-input"
          ref={inputRef}
          value={input}
          onChange={onChange}
          placeholder={t("common.searchProvider")}
          onFocus={onFocus}
          autoCorrect={false}
        />
      </Flex>
    </>
  );
}
