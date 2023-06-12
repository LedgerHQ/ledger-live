import React, { useCallback, useRef } from "react";
import { Platform, TouchableOpacity, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import { Flex, Icons } from "@ledgerhq/native-ui";

type Props = {
  searchQuery?: string;
  onQueryUpdate: (_: string) => void;
};

const SearchbarContainer = styled(Flex).attrs({
  flex: 1,
  paddingHorizontal: 17.5,
  borderWidth: 1,
  borderRadius: 50,
  flexDirection: "row",
  alignItems: "center",
  height: 48,
})``;

const SearchbarTextInput = styled(TextInput).attrs({
  padding: 0,
  paddingLeft: 10,
  flex: 1,
})``;

export default ({ searchQuery, onQueryUpdate }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const textInput = useRef<TextInput>(null);

  const clear = useCallback(() => onQueryUpdate(""), [onQueryUpdate]);

  return (
    <SearchbarContainer borderColor="neutral.c40">
      <Icons.SearchMedium size={17} color="neutral.c70" />
      <SearchbarTextInput
        ref={textInput}
        returnKeyType="search"
        maxLength={50}
        onChangeText={onQueryUpdate}
        placeholder={t("manager.appList.searchApps")}
        placeholderTextColor={colors.neutral.c70}
        value={searchQuery}
        numberOfLines={1}
        style={{ color: colors.neutral.c100 }}
        keyboardType={Platform.OS === "android" ? "visible-password" : "default"}
      />
      {searchQuery && searchQuery.length > 0 ? (
        <TouchableOpacity onPress={clear}>
          <Icons.CircledCrossSolidMedium size={20} color="neutral.c60" />
        </TouchableOpacity>
      ) : null}
    </SearchbarContainer>
  );
};
