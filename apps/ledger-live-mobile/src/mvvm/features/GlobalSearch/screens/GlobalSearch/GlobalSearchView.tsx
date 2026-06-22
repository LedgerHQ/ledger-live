import React, { useRef } from "react";
import { TextInput, View } from "react-native";
import { NavBarBackButton, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { useExperimental } from "~/experimental";
import { useAutoFocusOnEnter } from "LLM/features/GlobalSearch/hooks/useAutoFocusOnEnter";
import { DefaultSections } from "./components/DefaultSections";
import { SearchResults } from "./components/SearchResults";
import { GLOBAL_SEARCH_TEST_IDS } from "./testIds";
import type { GlobalSearchViewModel } from "./useGlobalSearchViewModel";

type Props = Readonly<GlobalSearchViewModel>;

export function GlobalSearchView({
  search,
  setSearch,
  clearSearch,
  onBack,
  isSearchActive,
  defaultSections,
  isLoadingDefaults,
  searchResults,
  isLoadingSearch,
  hasNoResults,
  hasError,
  onSeeAll,
  onAssetPress,
  onStockPress,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();
  const inputRef = useRef<TextInput>(null);
  useAutoFocusOnEnter(inputRef);

  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: theme.sizes.s64,
        paddingLeft: theme.spacings.s4,
        paddingRight: theme.spacings.s16,
        paddingVertical: theme.spacings.s8,
        gap: theme.spacings.s8,
      },
      searchInputContainer: {
        flex: 1,
      },
    }),
    [],
  );

  const topPadding = hasExperimentalHeader ? 0 : insets.top;

  return (
    <View testID={GLOBAL_SEARCH_TEST_IDS.screen} style={styles.container}>
      <View style={{ paddingTop: topPadding }}>
        <View style={styles.header}>
          <NavBarBackButton onPress={onBack} accessibilityLabel={t("common.back")} />
          <View style={styles.searchInputContainer}>
            <SearchInput
              ref={inputRef}
              testID={GLOBAL_SEARCH_TEST_IDS.searchInput}
              value={search}
              onChangeText={setSearch}
              onClear={clearSearch}
              hideClearButton={false}
              placeholder={t("globalSearch.searchPlaceholder")}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>
      {isSearchActive ? (
        <SearchResults
          results={searchResults}
          isLoading={isLoadingSearch}
          hasNoResults={hasNoResults}
          hasError={hasError}
          onAssetPress={onAssetPress}
        />
      ) : (
        <DefaultSections
          sections={defaultSections}
          isLoading={isLoadingDefaults}
          hasError={hasError}
          onSeeAll={onSeeAll}
          onAssetPress={onAssetPress}
          onStockPress={onStockPress}
        />
      )}
    </View>
  );
}
