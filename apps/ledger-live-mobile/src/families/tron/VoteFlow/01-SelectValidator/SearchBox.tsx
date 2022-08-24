import React from "react";
import { useTranslation } from "react-i18next";
import { Box, SearchInput } from "@ledgerhq/native-ui";

export default function SelectValidatorSearchBox({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (_: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Box mx={6} mt={3} mb={4}>
      <SearchInput
        returnKeyType="search"
        maxLength={50}
        onChange={setSearchQuery}
        placeholder={t("common.search")}
        value={searchQuery}
        numberOfLines={1}
      />
    </Box>
  );
}
