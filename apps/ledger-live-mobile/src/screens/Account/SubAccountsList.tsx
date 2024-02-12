import React, { useCallback, useState, useMemo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import take from "lodash/take";
import { StyleSheet, View, FlatList, ListRenderItem } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Account, SubAccount, TokenAccount } from "@ledgerhq/types-live";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { getAccountCurrency, listSubAccounts } from "@ledgerhq/live-common/account/index";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import { DropdownMedium, DropupMedium, PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { NavigatorName, ScreenName } from "~/const";
import SubAccountRow from "~/components/SubAccountRow";
import Touchable from "~/components/Touchable";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import perFamilySubAccountList from "../../generated/SubAccountList";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import Button from "~/components/Button";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";

const keyExtractor = (item: SubAccount): string => item.id;

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
});

type Props = {
  parentAccount: Account;
  onAccountPress: (_: SubAccount) => void;
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
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const subAccounts = listSubAccounts(parentAccount).filter(subAccount => {
    return !blacklistedTokenIds.includes(getAccountCurrency(subAccount).id);
  });

  const family = parentAccount.currency.family;
  const specific = perFamilySubAccountList[family as keyof typeof perFamilySubAccountList];

  const hasSpecificTokenWording = specific && specific.hasSpecificTokenWording;

  const Placeholder = specific && specific.Placeholder;

  const isToken = useMemo(
    () => listTokenTypesForCryptoCurrency(parentAccount.currency).length > 0,
    [parentAccount],
  );

  const navigateToReceiveConnectDevice = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        accountId,
      },
    });
  }, [accountId, navigation]);

  const renderHeader = useCallback(
    () => (
      <SectionTitle
        title={
          <>
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
          </>
        }
        containerProps={{ mb: 6 }}
      />
    ),
    [isToken, hasSpecificTokenWording, family, subAccounts.length],
  );

  const renderFooter = useCallback(() => {
    // If there are no sub accounts, we render the touchable rect
    if (subAccounts.length === 0) {
      return Placeholder ? (
        <Placeholder accountId={accountId} />
      ) : (
        <Touchable event="AccountReceiveSubAccount" onPress={navigateToReceiveConnectDevice}>
          <View
            style={[
              styles.footer,
              {
                borderColor: colors.fog,
              },
            ]}
          >
            <PlusMedium color={"primary.c80"} size={26} />
            <View style={styles.footerText}>
              <Text variant={"large"}>
                <Trans
                  i18nKey={`account.tokens${hasSpecificTokenWording ? `.${family}` : ""}.howTo`}
                  values={{ currency: parentAccount.currency.family }}
                >
                  <Text variant={"large"} fontWeight={"semiBold"}>
                    PLACEHOLDER_TEXT
                  </Text>
                  <Text variant={"large"} fontWeight={"semiBold"}>
                    PLACEHOLDER_TEXT
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

  const renderItem: ListRenderItem<SubAccount> = useCallback(
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
    [onAccountPress, parentAccount, useCounterValue],
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
