// @flow
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import colors from "../../../../colors";
import TextInput from "../../../../components/TextInput";
import SearchIcon from "../../../../icons/Search";

export default function SelectValidatorSearchBox({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string,
  setSearchQuery: (query: string) => void,
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchBar}>
        <View style={styles.searchBarIcon}>
          <SearchIcon size={16} color={colors.smoke} />
        </View>

        <TextInput
          returnKeyType="search"
          maxLength={50}
          onChangeText={setSearchQuery}
          clearButtonMode="always"
          style={[styles.searchBarText, styles.searchBarInput]}
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    alignItems: "stretch",
  },
  searchBar: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "row",
    height: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: colors.lightFog,
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
    color: colors.smoke,
  },
});
