/* @flow */
import React, { useCallback } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
import { NavigatorName, ScreenName } from "../../const";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import {
  ReceiveActionDefault,
  SendActionDefault,
  BuyActionDefault,
} from "./AccountActionsDefault";
import perFamilyAccountActions from "../../generated/accountActions";

import getWindowDimensions from "../../logic/getWindowDimensions";
import { isCurrencySupported } from "../Exchange/coinifyConfig";

const { width } = getWindowDimensions();

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

type NavOptions = {
  screen: string,
  params?: { [key: string]: any },
};

export default function AccountActions({ account, parentAccount }: Props) {
  const navigation = useNavigation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const mainAccount = getMainAccount(account, parentAccount);
  const decorators = perFamilyAccountActions[mainAccount.currency.family];

  const accountId = account.id;
  const parentId = parentAccount && parentAccount.id;

  const SendAction = (decorators && decorators.SendAction) || SendActionDefault;
  const BuyAction = (decorators && decorators.BuyAction) || BuyActionDefault;

  const ReceiveAction =
    (decorators && decorators.ReceiveAction) || ReceiveActionDefault;

  const onNavigate = useCallback(
    (name: string, options?: NavOptions) => {
      navigation.navigate(name, {
        ...options,
        params: {
          accountId,
          parentId,
          ...(options ? options.params : {}),
        },
      });
    },
    [accountId, navigation, parentId],
  );

  const manageAction =
    (decorators &&
      decorators.getManageAction &&
      decorators.getManageAction({
        account,
        parentAccount,
        onNavigate,
        style: !readOnlyModeEnabled ? styles.scrollBtn : styles.btn,
      })) ||
    null;

  const onSend = useCallback(() => {
    onNavigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
    });
  }, [onNavigate]);

  const onReceive = useCallback(() => {
    onNavigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConnectDevice,
    });
  }, [onNavigate]);

  const onBuy = useCallback(() => {
    onNavigate(NavigatorName.Exchange);
  }, [onNavigate]);

  const Container =
    !readOnlyModeEnabled && manageAction ? ScrollViewContainer : View;
  const btnStyle =
    !readOnlyModeEnabled && manageAction ? styles.scrollBtn : styles.btn;

  const canBeBought = isCurrencySupported(getAccountCurrency(account));

  return (
    <Container style={styles.root}>
      {!readOnlyModeEnabled && (
        <SendAction
          account={account}
          parentAccount={parentAccount}
          style={[btnStyle]}
          onPress={onSend}
        />
      )}
      <ReceiveAction
        account={account}
        parentAccount={parentAccount}
        style={[btnStyle]}
        onPress={onReceive}
      />
      {!readOnlyModeEnabled && canBeBought && (
        <BuyAction
          account={account}
          parentAccount={parentAccount}
          style={[btnStyle]}
          onPress={onBuy}
        />
      )}
      {manageAction}
    </Container>
  );
}

const ScrollViewContainer = ({ children }: { children: React$Node }) => (
  <View style={styles.scrollContainer}>
    <ScrollView
      showsHorizontalScrollIndicator={false}
      horizontal
      style={styles.scrollView}
    >
      <View style={styles.scrollRoot}>{children}</View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  scrollContainer: {
    paddingHorizontal: 12,
    overflow: "visible",
    width: "100%",
  },
  scrollView: {
    overflow: "visible",
    width: "100%",
  },
  scrollRoot: {
    minWidth: width - 30,
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 6,
  },
  scrollBtn: {
    flexGrow: 1,
    marginHorizontal: 4,
    paddingHorizontal: 6,
  },
});
