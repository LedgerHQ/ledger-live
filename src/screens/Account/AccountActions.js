/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
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

  const ManageAction = (decorators && decorators.ManageAction) || null;

  const onNavigate = useCallback(
    (route: string) => {
      navigation.navigate(route, {
        accountId,
        parentId,
      });
    },
    [accountId, parentId, navigation],
  );

  const onSend = useCallback(() => {
    onNavigate("SendSelectRecipient");
  }, [onNavigate]);

  const onReceive = useCallback(() => {
    onNavigate("ReceiveConnectDevice");
  }, [onNavigate]);

  return (
    <View style={styles.root}>
      {!readOnlyModeEnabled && (
        <SendAction
          account={account}
          parentAccount={parentAccount}
          style={[styles.btn, styles.marginRight]}
          onPress={onSend}
        />
      )}
      <ReceiveAction
        account={account}
        parentAccount={parentAccount}
        style={[styles.btn, !readOnlyModeEnabled ? styles.marginLeft : null]}
        onPress={onReceive}
      />
      {ManageAction && (
        <ManageAction
          account={account}
          parentAccount={parentAccount}
          onNavigate={onNavigate}
          style={[styles.btn, styles.manageAction]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  btn: {
    flex: 1,
  },
  marginRight: {
    marginRight: 8,
  },
  marginLeft: {
    marginLeft: 8,
  },
  manageAction: {
    marginLeft: 16,
  },
});

export default withNavigation(connect(mapStateToProps)(AccountActions));
