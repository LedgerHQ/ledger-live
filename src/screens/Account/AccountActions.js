/* @flow */
import React, { useCallback } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { createStructuredSelector } from "reselect";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { connect } from "react-redux";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import {
  ReceiveActionDefault,
  SendActionDefault,
} from "./AccountActionsDefault";
import perFamilyAccountActions from "../../generated/accountActions";

import getWindowDimensions from "../../logic/getWindowDimensions";

const { width } = getWindowDimensions();

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: *,
  readOnlyModeEnabled: boolean,
};
const mapStateToProps = createStructuredSelector({
  readOnlyModeEnabled: readOnlyModeEnabledSelector,
});

const AccountActions = ({
  readOnlyModeEnabled,
  navigation,
  account,
  parentAccount,
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const decorators = perFamilyAccountActions[mainAccount.currency.family];

  const accountId = account.id;
  const parentId = parentAccount && parentAccount.id;

  const SendAction = (decorators && decorators.SendAction) || SendActionDefault;

  const ReceiveAction =
    (decorators && decorators.ReceiveAction) || ReceiveActionDefault;

  const onNavigate = useCallback(
    (route: string) => {
      navigation.navigate(route, {
        accountId,
        parentId,
      });
    },
    [accountId, parentId, navigation],
  );

  const manageAction =
    (decorators &&
      decorators.getManageAction &&
      decorators.getManageAction({
        account,
        parentAccount,
        onNavigate,
        style: styles.scrollBtn,
      })) ||
    null;

  const onSend = useCallback(() => {
    onNavigate("SendSelectRecipient");
  }, [onNavigate]);

  const onReceive = useCallback(() => {
    onNavigate("ReceiveConnectDevice");
  }, [onNavigate]);

  const Container = manageAction ? ScrollViewContainer : View;
  const btnStyle = manageAction ? styles.scrollBtn : styles.btn;

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
      {manageAction}
    </Container>
  );
};

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

export default withNavigation(connect(mapStateToProps)(AccountActions));
