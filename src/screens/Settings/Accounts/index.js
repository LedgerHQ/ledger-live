/* @flow */
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { compose } from "redux";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { findTokenById } from "@ledgerhq/live-common/lib/data/tokens";
// $FlowFixMe
import { NavigationScreenProp, SectionList } from "react-navigation";
import i18next from "i18next";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../../components/SettingsRow";
import { showToken } from "../../../actions/settings";
import { blacklistedTokenIdsSelector } from "../../../reducers/settings";
import LText from "../../../components/LText";
import CurrencyIcon from "../../../components/CurrencyIcon";
import colors from "../../../colors";
import { TrackScreen } from "../../../analytics";
import HideEmptyTokenAccountsRow from "./HideEmptyTokenAccountsRow";
import Close from "../../../icons/Close";

type Props = {
  blacklistedTokenIds: string[],
  showToken: string => void,
  navigation: NavigationScreenProp<*>,
};

const mapDispatchToProps = {
  showToken,
};

const mapStateToProps = createStructuredSelector({
  blacklistedTokenIds: blacklistedTokenIdsSelector,
});

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

const AccountsSettings = ({ blacklistedTokenIds, showToken }: Props) => {
  const renderSectionHeader = useCallback(
    ({
      section: { parentCurrency },
    }: {
      section: { parentCurrency: CryptoCurrency },
    }) => (
      <View style={styles.section}>
        <LText primary style={styles.sectionTitle}>
          {parentCurrency.name}
        </LText>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item: token }: { item: TokenCurrency }) => (
      <View style={styles.row}>
        <View style={{ marginRight: 12 }}>
          <CurrencyIcon currency={token} size={20} />
        </View>
        <LText style={{ flex: 1 }}>{token.name}</LText>
        <TouchableOpacity
          onPress={() => showToken(token.id)}
          style={styles.cta}
          hitSlop={hitSlop}
        >
          <Close size={16} color={colors.smoke} />
        </TouchableOpacity>
      </View>
    ),
    [showToken],
  );

  const keyExtractor = useCallback(() => token => token.id, []);

  const renderHeader = useCallback(
    () => (
      <>
        <TrackScreen category="Settings" name="Accounts" />
        <HideEmptyTokenAccountsRow />
        <SettingsRow
          event="HideEmptyTokenAccountsRow"
          title={<Trans i18nKey="settings.accounts.blacklistedTokens" />}
          desc={<Trans i18nKey="settings.accounts.blacklistedTokensDesc" />}
          onPress={null}
          alignedTop
        >
          {null}
        </SettingsRow>
      </>
    ),
    [],
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
      style={styles.root}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      sections={sections}
    />
  );
};

AccountsSettings.navigationOptions = {
  title: i18next.t("settings.accounts.title"),
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    backgroundColor: "white",
    marginBottom: 2,
    flex: 1,
  },
  section: {
    flex: 1,
    backgroundColor: "white",
  },
  sectionTitle: {
    backgroundColor: colors.lightGrey,
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
  cta: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
});

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(AccountsSettings);
