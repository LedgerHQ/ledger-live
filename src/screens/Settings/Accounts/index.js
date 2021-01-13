/* @flow */
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { TouchableOpacity, View, StyleSheet, SectionList } from "react-native";
import { findTokenById } from "@ledgerhq/live-common/lib/currencies";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../../components/SettingsRow";
import { showToken } from "../../../actions/settings";
import { blacklistedTokenIdsSelector } from "../../../reducers/settings";
import { cryptoCurrenciesSelector } from "../../../reducers/accounts";
import LText from "../../../components/LText";
import CurrencyIcon from "../../../components/CurrencyIcon";
import { TrackScreen } from "../../../analytics";
import HideEmptyTokenAccountsRow from "./HideEmptyTokenAccountsRow";
import Close from "../../../icons/Close";
import { ScreenName } from "../../../const";

export default function AccountsSettings({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const currencies = useSelector(cryptoCurrenciesSelector);
  const dispatch = useDispatch();

  const renderSectionHeader = useCallback(
    ({
      section: { parentCurrency },
    }: {
      section: { parentCurrency: CryptoCurrency },
    }) => (
      <View style={styles.section}>
        <LText
          primary
          style={[styles.sectionTitle, { backgroundColor: colors.card }]}
        >
          {parentCurrency.name}
        </LText>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item: token }: { item: TokenCurrency }) => (
      <View style={styles.row}>
        <View style={styles.rowIconContainer}>
          <CurrencyIcon currency={token} size={20} />
        </View>
        <LText style={styles.rowTitle}>{token.name}</LText>
        <TouchableOpacity
          onPress={() => showToken(dispatch(token.id))}
          style={styles.cta}
          hitSlop={hitSlop}
        >
          <Close size={16} color={colors.smoke} />
        </TouchableOpacity>
      </View>
    ),
    [dispatch],
  );

  const keyExtractor = useCallback(token => token.id, []);

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
        <SettingsRow
          event="HideEmptyTokenAccountsRow"
          title={t("settings.accounts.blacklistedTokens")}
          desc={t("settings.accounts.blacklistedTokensDesc")}
          onPress={null}
          alignedTop
        >
          {null}
        </SettingsRow>
      </>
    ),
    [navigation, t, currencies.length],
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
    // $FlowFixMe
    <SectionList
      ListHeaderComponent={renderHeader}
      stickySectionHeadersEnabled
      style={[styles.root, { backgroundColor: colors.white }]}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      sections={sections}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
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
