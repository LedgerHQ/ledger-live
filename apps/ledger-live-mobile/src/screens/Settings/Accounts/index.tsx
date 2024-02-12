import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { TouchableOpacity, View, StyleSheet, SectionList } from "react-native";
import { findTokenById } from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DefaultTheme, useTheme } from "styled-components/native";
import SettingsRow from "~/components/SettingsRow";
import { showToken } from "~/actions/settings";
import {
  blacklistedTokenIdsSelector,
  // TODO: hiddenNftCollection is never used 😱 is it safe to remove
  // hiddenNftCollectionsSelector,
} from "~/reducers/settings";
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

export default function AccountsSettings({
  navigation,
}: StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.AccountsSettings>) {
  const { colors } = useTheme() as DefaultTheme & Theme;
  const { t } = useTranslation();
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const currencies = useSelector(cryptoCurrenciesSelector);
  // TODO: hiddenNftCollection is never used 😱 is it safe to remove
  // const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
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
    // TODO: hiddenNftCollection is never used 😱 is it safe to remove
    // [currencies.length, t, hiddenNftCollections.length, navigation],
    [currencies.length, t, navigation],
  );

  const sections = useMemo(() => {
    const tmpSections = [];
    for (const tokenId of blacklistedTokenIds) {
      const token = findTokenById(tokenId);
      if (token) {
        const parentCurrency = token.parentCurrency;
        const index = tmpSections.findIndex(s => s.key === parentCurrency.id);
        if (index < 0) {
          tmpSections.push({
            key: parentCurrency.id,
            parentCurrency,
            data: [token],
          });
        } else {
          tmpSections[index].data.push(token);
        }
      }
    }
    return tmpSections;
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
