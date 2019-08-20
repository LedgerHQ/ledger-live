// @flow

import React, { useCallback, useState } from "react";
import { compose } from "redux";
import { Trans } from "react-i18next";
import take from "lodash/take";
import { FlatList, Platform, StyleSheet, View } from "react-native";
import type { TokenAccount, Account } from "@ledgerhq/live-common/lib/types";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import MaterialIcon from "react-native-vector-icons/dist/MaterialIcons";
import { withNavigation } from "react-navigation";
import { listTokenAccounts } from "@ledgerhq/live-common/lib/account";
import TokenRow from "../../components/TokenRow";
import withEnv from "../../logic/withEnv";
import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Touchable from "../../components/Touchable";

const keyExtractor = o => o.id;

const styles = StyleSheet.create({
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
  header: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

const TokenAccountsList = ({
  parentAccount,
  onAccountPress,
  navigation,
  accountId,
}: {
  parentAccount: Account,
  onAccountPress: TokenAccount => *,
  navigation: *,
  accountId: string,
}) => {
  const [isCollapsed, setCollapsed] = useState(true);
  const tokenAccounts = listTokenAccounts(parentAccount);

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <LText
          fontWeight="500"
          style={{ color: colors.darkBlue, fontSize: 16 }}
        >{`Tokens (${tokenAccounts.length})`}</LText>
        {tokenAccounts.length > 0 ? (
          <Button
            containerStyle={{ width: 120 }}
            type="lightSecondary"
            event="AccountReceiveToken"
            title={<Trans i18nKey="account.tokens.addTokens" />}
            IconLeft={() => (
              <MaterialIcon color={colors.live} name="add" size={20} />
            )}
            onPress={() =>
              navigation.navigate("ReceiveConnectDevice", { accountId })
            }
            size={14}
          />
        ) : null}
      </View>
    ),
    [tokenAccounts, navigation, accountId],
  );

  const renderFooter = useCallback(() => {
    // If there is no token accounts, we render the touchable rect
    if (tokenAccounts.length === 0) {
      return (
        <Touchable
          event="AccountReceiveToken"
          onPress={() =>
            navigation.navigate("ReceiveConnectDevice", { accountId })
          }
        >
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
        </Touchable>
      );
    }

    // If there is 3 or less token accounts, no need for collapse button
    if (tokenAccounts.length <= 3) {
      return null;
    }

    // else, we render the collapse button
    return (
      <Card>
        <Button
          type="lightSecondary"
          event="accountExpandTokenList"
          title={
            <Trans
              i18nKey={
                isCollapsed
                  ? "account.tokens.seeMore"
                  : "account.tokens.seeLess"
              }
            />
          }
          IconRight={() => (
            <Icon
              color={colors.live}
              name={isCollapsed ? "angle-down" : "angle-up"}
              size={16}
            />
          )}
          onPress={() => setCollapsed(isCollapsed => !isCollapsed)}
          size={13}
        />
      </Card>
    );
  }, [isCollapsed, navigation, tokenAccounts, accountId]);

  const renderItem = useCallback(
    ({ item }) => (
      <Card>
        <TokenRow account={item} onTokenAccountPress={onAccountPress} />
      </Card>
    ),
    [onAccountPress],
  );

  return (
    <View style={styles.tokenList}>
      <FlatList
        data={isCollapsed ? take(tokenAccounts, 3) : tokenAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

export default compose(
  withNavigation,
  withEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
)(TokenAccountsList);
