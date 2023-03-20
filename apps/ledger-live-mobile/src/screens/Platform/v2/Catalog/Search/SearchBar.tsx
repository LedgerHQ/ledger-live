import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex, Link, SearchInput } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { SearchBarValues } from "../types";

export function SearchBar({
  input,
  inputRef,
  onChange,
  onCancel,
  onFocus,
  isActive,
}: Omit<SearchBarValues<LiveAppManifest>, "result" | "isSearching">) {
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

        {onCancel && isActive && (
          <Flex marginLeft={6} justifyContent={"center"}>
            <Link onPress={onCancel}>{t("common.cancel")}</Link>
          </Flex>
        )}
      </Flex>
    </>
  );
}
