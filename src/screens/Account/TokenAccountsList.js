// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { FlatList, Platform, StyleSheet, View } from "react-native";
import type { TokenAccount } from "@ledgerhq/live-common/lib/types";
import Icon from "react-native-vector-icons/dist/Feather";
import TokenRow from "../../components/TokenRow";
import colors from "../../colors";
import LText from "../../components/LText";

const keyExtractor = o => o.id;

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  footer: {
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.fog,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  footerText: {
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
    paddingLeft: 12,
    flexDirection: "row",
  },
  tokenList: {
    paddingTop: 32,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: colors.black,
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
});

const Card = ({ children }: { children: any }) => (
  <View style={styles.card}>{children}</View>
);

const Header = ({ tokenAccounts }: { tokenAccounts: TokenAccount[] }) => (
  <View style={styles.header}>
    <LText
      fontWeight="500"
      style={{ color: colors.darkBlue, fontSize: 16 }}
    >{`Tokens (${tokenAccounts.length})`}</LText>
  </View>
);

const Footer = () => (
  <View style={styles.footer}>
    <Icon color={colors.live} size={26} name="plus" />
    <View style={styles.footerText}>
      <LText style={{ fontSize: 16 }}>
        <Trans i18nKey="account.tokens.howTo">
          <LText semiBold>text</LText>
          <LText semiBold>text</LText>
        </Trans>
      </LText>
    </View>
  </View>
);

const TokenAccountsList = ({
  tokenAccounts,
  onAccountPress,
}: {
  tokenAccounts: TokenAccount[],
  onAccountPress: TokenAccount => *,
}) => {
  const renderItem = useCallback(
    ({ item }) => (
      <Card>
        <TokenRow account={item} onTokenAccountPress={onAccountPress} />
      </Card>
    ),
    [],
  );
  return (
    <View style={styles.tokenList}>
      <FlatList
        data={tokenAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<Header tokenAccounts={tokenAccounts} />}
        ListFooterComponent={<Footer />}
      />
    </View>
  );
};

export default TokenAccountsList;
