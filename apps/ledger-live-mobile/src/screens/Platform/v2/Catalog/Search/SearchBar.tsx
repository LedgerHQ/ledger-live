import { Flex, SearchInput, Text } from "@ledgerhq/native-ui";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Search } from "../../types";

export function SearchBar({
  search: { input, inputRef, onChange, onFocus },
  onCancel,
}: {
  search: Pick<Search, "input" | "inputRef" | "onChange" | "onFocus">;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Flex
        backgroundColor="background.main"
        marginBottom={16}
        flexDirection={"row"}
        alignItems="center"
        zIndex={10}
      >
        <SearchInput
          containerStyle={{
            flexGrow: 1,
            flexShrink: 1,
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
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            testID="catalog-search-cancel"
            accessibilityLabel={t("common.cancel")}
            accessibilityRole="button"
          >
            <Text variant="body" fontWeight="semiBold" color="primary.c80" marginLeft={4}>
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
        )}
      </Flex>
    </>
  );
}
