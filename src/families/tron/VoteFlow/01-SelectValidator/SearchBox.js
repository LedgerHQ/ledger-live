// @flow
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import TextInput from "../../../../components/TextInput";
import SearchIcon from "../../../../icons/Search";

export default function SelectValidatorSearchBox({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string,
  setSearchQuery: (query: string) => void,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.searchBar, { backgroundColor: colors.lightFog }]}>
        <View style={styles.searchBarIcon}>
          <SearchIcon size={16} color={colors.smoke} />
        </View>

        <TextInput
          returnKeyType="search"
          maxLength={50}
          onChangeText={setSearchQuery}
          clearButtonMode="always"
          style={[
            styles.searchBarText,
            styles.searchBarInput,
            { color: colors.smoke },
          ]}
          placeholder={t("common.search")}
          placeholderTextColor={colors.smoke}
          onInputCleared={() => setSearchQuery("")}
          value={searchQuery}
          numberOfLines={1}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    height: 44,
    alignItems: "center",
    justifyContent: "flex-start",

    borderRadius: 3,
    paddingRight: Platform.OS === "ios" ? 0 : 44,
  },
  searchBarIcon: {
    flexBasis: 44,
    flexGrow: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarInput: {
    flexGrow: 1,
    flexDirection: "row",
    height: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 3,
  },
  searchBarText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 17,
  },
});
