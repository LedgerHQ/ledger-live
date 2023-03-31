import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex, SearchInput } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { SearchBarValues } from "../types";

export function SearchBar({
  input,
  inputRef,
  onChange,
  onFocus,
}: Omit<
  SearchBarValues<LiveAppManifest>,
  "result" | "isSearching" | "isActive" | "onCancel"
>) {
  const { t } = useTranslation();

  return (
    <>
      <Flex
        backgroundColor="background.main"
        marginBottom={16}
        flexDirection={"row"}
        zIndex={10}
      >
        <SearchInput
          containerStyle={{
            flexGrow: 1,
            width: 100,
          }}
          data-test-id="platform-catalog-search-input"
          ref={inputRef}
          value={input}
          onChange={onChange}
          placeholder={t("common.search")}
          onFocus={onFocus}
        />
      </Flex>
    </>
  );
}
