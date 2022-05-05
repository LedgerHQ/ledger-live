import React, { useCallback, useState, useMemo } from "react";
import { Trans } from "react-i18next";
import take from "lodash/take";
import { StyleSheet, View, FlatList } from "react-native";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import { useNavigation, useTheme } from "@react-navigation/native";
import {
  Account,
  SubAccount,
  TokenAccount,
} from "@ledgerhq/live-common/lib/types";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { listSubAccounts } from "@ledgerhq/live-common/lib/account";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { DropdownMedium, DropupMedium } from "@ledgerhq/native-ui/assets/icons";
import { NavigatorName, ScreenName } from "../../const";
import SubAccountRow from "../../components/SubAccountRow";
import Touchable from "../../components/Touchable";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import perFamilySubAccountList from "../../generated/SubAccountList";

const keyExtractor = (o: any) => o.id;

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
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

type Props = {
  parentAccount: Account;
  onAccountPress: (subAccount: SubAccount) => void;
  accountId: string;
  useCounterValue?: boolean;
};

export default function SubAccountsList({
  parentAccount,
  onAccountPress,
  accountId,
  useCounterValue,
}: Props) {
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { colors } = useTheme();
  const navigation = useNavigation();
  const [account, setAccount] = useState<TokenAccount | typeof undefined>();
  const [isCollapsed, setIsCollapsed] = useState(true);
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
        <Text variant={"h3"}>
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
        </Text>
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
              <Text variant={"large"}>
                <Trans
                  i18nKey={`account.tokens${
                    hasSpecificTokenWording ? `.${family}` : ""
                  }.howTo`}
                  values={{ currency: parentAccount.currency.family }}
                >
                  <Text variant={"large"} fontWeight={"semiBold"}>
                    text
                  </Text>
                  <Text variant={"large"} fontWeight={"semiBold"}>
                    text
                  </Text>
                </Trans>
              </Text>
            </View>
          </View>
        </Touchable>
      );
    }
    // If there is 3 or less sub accounts, no need for collapse button
    if (subAccounts.length <= 3) return null;

    // else, we render the collapse button
    return (
      <Button
        type={"shade"}
        outline
        event="accountExpandTokenList"
        Icon={isCollapsed ? DropdownMedium : DropupMedium}
        iconPosition={"right"}
        onPress={() => setIsCollapsed(!isCollapsed)}
        size={"small"}
        mt={3}
      >
        {" "}
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
      </Button>
    );
  }, [
    subAccounts.length,
    isCollapsed,
    isToken,
    navigateToReceiveConnectDevice,
    parentAccount.currency.family,
    family,
    hasSpecificTokenWording,
    colors,
    Placeholder,
    accountId,
  ]);

  const renderItem = useCallback(
    ({ item }) => (
      <Flex alignItems={"center"}>
        <SubAccountRow
          account={item}
          parentAccount={parentAccount}
          onSubAccountLongPress={account => setAccount(account)}
          onSubAccountPress={onAccountPress}
          useCounterValue={useCounterValue}
        />
      </Flex>
    ),
    [onAccountPress, parentAccount],
  );

  if (!isToken && subAccounts.length === 0) {
    return null;
  }

  return (
    <>
      <FlatList
        data={isCollapsed ? take(subAccounts, 3) : subAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
      {account && (
        <TokenContextualModal
          onClose={() => setAccount(undefined)}
          isOpened={!!account}
          account={account}
        />
      )}
    </>
  );
}
