// @flow

import React, { useCallback, useState, useMemo } from "react";
import { Trans } from "react-i18next";
import take from "lodash/take";
import { Platform, StyleSheet, View, FlatList } from "react-native";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import MaterialIcon from "react-native-vector-icons/dist/MaterialIcons";
import { useNavigation, useTheme } from "@react-navigation/native";
import type {
  Account,
  SubAccount,
  TokenAccount,
} from "@ledgerhq/live-common/lib/types";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { listSubAccounts } from "@ledgerhq/live-common/lib/account";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import { NavigatorName, ScreenName } from "../../const";
import SubAccountRow from "../../components/SubAccountRow";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Touchable from "../../components/Touchable";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import perFamilySubAccountList from "../../generated/SubAccountList";

const keyExtractor = o => o.id;

const styles = StyleSheet.create({
  footer: {
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderStyle: "dashed",
    borderWidth: 1,
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
  subAccountList: {
    paddingTop: 32,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 8,
    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
});

const Card = ({ children, style }: { children: any, style: * }) => (
  <View style={style}>{children}</View>
);

type Props = {
  parentAccount: Account,
  onAccountPress: (subAccount: SubAccount) => void,
  accountId: string,
  isCollapsed: boolean,
  onToggle: () => void,
};

export default function SubAccountsList({
  parentAccount,
  onAccountPress,
  accountId,
  isCollapsed,
  onToggle,
}: Props) {
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { colors } = useTheme();
  const navigation = useNavigation();
  const [account, setAccount] = useState<TokenAccount | typeof undefined>();
  const subAccounts = listSubAccounts(parentAccount);
  const family = parentAccount.currency.family;
  const specific = perFamilySubAccountList[family];

  const hasSpecificTokenWording = specific && specific.hasSpecificTokenWording;
  const ReceiveButton = specific && specific.ReceiveButton;

  const Placeholder = specific && specific.Placeholder;

  const isToken = useMemo(
    () => listTokenTypesForCryptoCurrency(parentAccount.currency).length > 0,
    [parentAccount],
  );

  const navigateToReceiveConnectDevice = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConnectDevice,
      params: {
        accountId,
      },
    });
  }, [accountId, navigation]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <LText semiBold style={{ fontSize: 16 }}>
          <Trans
            i18nKey={
              isToken
                ? hasSpecificTokenWording
                  ? `${family}.token`
                  : "common.token"
                : "common.subaccount"
            }
            count={subAccounts.length}
          />
          {` (${subAccounts.length})`}
        </LText>
        {isToken && subAccounts.length > 0 ? (
          ReceiveButton ? (
            <ReceiveButton accountId={accountId} />
          ) : (
            <Button
              containerStyle={{ width: 120 }}
              type="lightSecondary"
              event="AccountReceiveToken"
              title={<Trans i18nKey="account.tokens.addTokens" />}
              IconLeft={() => (
                <MaterialIcon color={colors.live} name="add" size={20} />
              )}
              onPress={navigateToReceiveConnectDevice}
              size={14}
            />
          )
        ) : null}
      </View>
    ),
    [
      isToken,
      hasSpecificTokenWording,
      family,
      subAccounts.length,
      ReceiveButton,
      accountId,
      navigateToReceiveConnectDevice,
      colors.live,
    ],
  );

  const renderFooter = useCallback(() => {
    // If there are no sub accounts, we render the touchable rect
    if (subAccounts.length === 0) {
      return Placeholder ? (
        <Placeholder accountId={accountId} />
      ) : (
        <Touchable
          event="AccountReceiveSubAccount"
          onPress={navigateToReceiveConnectDevice}
        >
          <View
            style={[
              styles.footer,
              {
                borderColor: colors.fog,
              },
            ]}
          >
            <Icon color={colors.live} size={26} name="plus" />
            <View style={styles.footerText}>
              <LText style={{ fontSize: 16 }}>
                <Trans
                  i18nKey={`account.tokens${
                    hasSpecificTokenWording ? `.${family}` : ""
                  }.howTo`}
                  values={{ currency: parentAccount.currency.family }}
                >
                  <LText semiBold>text</LText>
                  <LText semiBold>text</LText>
                </Trans>
              </LText>
            </View>
          </View>
        </Touchable>
      );
    }

    // If there is 3 or less sub accounts, no need for collapse button
    if (subAccounts.length <= 3) {
      return null;
    }

    // else, we render the collapse button
    return (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            ...Platform.select({
              android: {},
              ios: {
                shadowColor: colors.black,
              },
            }),
          },
        ]}
      >
        <Button
          type="lightSecondary"
          event="accountExpandTokenList"
          title={
            <Trans
              i18nKey={
                isCollapsed
                  ? `account.${
                      isToken
                        ? hasSpecificTokenWording
                          ? `tokens.${family}`
                          : "tokens"
                        : "subaccounts"
                    }.seeMore`
                  : `account.${
                      isToken
                        ? hasSpecificTokenWording
                          ? `tokens.${family}`
                          : "tokens"
                        : "subaccounts"
                    }.seeLess`
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
          onPress={onToggle}
          size={13}
        />
      </Card>
    );
  }, [
    subAccounts.length,
    isCollapsed,
    isToken,
    navigateToReceiveConnectDevice,
    parentAccount.currency.family,
    onToggle,
    family,
    hasSpecificTokenWording,
    colors,
    Placeholder,
    accountId,
  ]);

  const renderItem = useCallback(
    ({ item }) => (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            ...Platform.select({
              android: {},
              ios: {
                shadowColor: colors.black,
              },
            }),
          },
        ]}
      >
        <SubAccountRow
          account={item}
          onSubAccountLongPress={account => setAccount(account)}
          onSubAccountPress={onAccountPress}
        />
      </Card>
    ),
    [onAccountPress, colors],
  );

  if (
    !isToken &&
    subAccounts.length === 0 &&
    parentAccount.currency.family === "tezos" // Scoped for Tezos now, might need to change with future coins integration
  ) {
    return null;
  }

  return (
    <View style={styles.subAccountList}>
      <FlatList
        data={isCollapsed ? take(subAccounts, 3) : subAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
      <TokenContextualModal
        onClose={() => setAccount()}
        isOpened={!!account}
        account={account}
      />
    </View>
  );
}
