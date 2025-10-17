import React, { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { TouchableOpacity, View, StyleSheet, SectionList } from "react-native";
import { loadBlacklistedTokenSections as loadBlacklistedTokenSectionsBase } from "@ledgerhq/live-common/account/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DefaultTheme, useTheme } from "styled-components/native";
import SettingsRow from "~/components/SettingsRow";
import { showToken } from "~/actions/settings";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { cryptoCurrenciesSelector } from "~/reducers/accounts";
import LText from "~/components/LText";
import CurrencyIcon from "~/components/CurrencyIcon";
import { TrackScreen } from "~/analytics";
import HideEmptyTokenAccountsRow from "./HideEmptyTokenAccountsRow";
import FilterTokenOperationsZeroAmountRow from "./FilterTokenOperationsZeroAmountRow";
import Close from "~/icons/Close";
import { ScreenName } from "~/const";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import type { Theme } from "../../../colors";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type BlacklistedTokenSection = {
  key: string;
  parentCurrency: TokenCurrency["parentCurrency"];
  data: TokenCurrency[];
};

async function loadBlacklistedTokenSections(
  tokenIds: string[],
): Promise<BlacklistedTokenSection[]> {
  const sections = await loadBlacklistedTokenSectionsBase(tokenIds);
  return sections.map(section => ({
    key: section.parentCurrency.id,
    parentCurrency: section.parentCurrency,
    data: section.tokens,
  }));
}

export default function AccountsSettings({
  navigation,
}: StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.AccountsSettings>) {
  const { colors } = useTheme() as DefaultTheme & Theme;
  const { t } = useTranslation();
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const currencies = useSelector(cryptoCurrenciesSelector);
  const dispatch = useDispatch();

  const renderSectionHeader = useCallback(
    ({ section: { parentCurrency } }: { section: { parentCurrency: CryptoCurrency } }) => (
      <View style={styles.section}>
        <LText style={[styles.sectionTitle, { backgroundColor: colors.card }]}>
          {parentCurrency.name}
        </LText>
      </View>
    ),
    [colors],
  );

  const renderItem = useCallback(
    ({ item: token }: { item: TokenCurrency }) => (
      <View style={styles.row}>
        <View style={styles.rowIconContainer}>
          <CurrencyIcon currency={token} size={20} />
        </View>
        <LText style={styles.rowTitle}>{token.name}</LText>
        <TouchableOpacity
          onPress={() => dispatch(showToken(token.id))}
          style={styles.cta}
          hitSlop={hitSlop}
        >
          <Close size={16} color={colors.smoke} />
        </TouchableOpacity>
      </View>
    ),
    [colors, dispatch],
  );

  const keyExtractor = useCallback((token: TokenCurrency) => token.id, []);

  const renderHeader = useCallback(
    () => (
      <>
        <TrackScreen category="Settings" name="Accounts" />
        {currencies.length > 0 && (
          <SettingsRow
            title={t("settings.accounts.cryptoAssets.title")}
            desc={t("settings.accounts.cryptoAssets.desc")}
            arrowRight
            onPress={() => navigation.navigate(ScreenName.CryptoAssetsSettings)}
          />
        )}
        <HideEmptyTokenAccountsRow />
        <FilterTokenOperationsZeroAmountRow />
      </>
    ),
    [currencies.length, t, navigation],
  );

  const [sections, setSections] = useState<BlacklistedTokenSection[]>([]);

  useEffect(() => {
    let mounted = true;
    loadBlacklistedTokenSections(blacklistedTokenIds)
      .then(loadedSections => {
        if (mounted) {
          setSections(loadedSections);
        }
      })
      .catch(error => {
        console.error("Failed to load blacklisted tokens:", error);
        if (mounted) {
          setSections([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, [blacklistedTokenIds]);

  return (
    <SectionList
      ListHeaderComponent={renderHeader}
      stickySectionHeadersEnabled
      style={[styles.root, { backgroundColor: colors.background.main }]}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      sections={sections}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    marginBottom: 2,
    flex: 1,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    flex: 1,
  },
  rowIconContainer: { marginRight: 12 },
  cta: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  rowTitle: { flex: 1 },
});

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};
