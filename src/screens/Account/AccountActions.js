/* @flow */
import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
import { NavigatorName, ScreenName } from "../../const";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import {
  ReceiveActionDefault,
  SendActionDefault,
} from "./AccountActionsDefault";
import perFamilyAccountActions from "../../generated/accountActions";

import BottomModal from "../../components/BottomModal";
import Button from "../../components/Button";
import ChoiceButton from "../../components/ChoiceButton";
import Transfer from "../../icons/Transfer";
import LendingBanners from "./LendingBanners";
import useActions from "./hooks/useActions";
import useLendingActions from "./hooks/useLendingActions";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

type NavOptions = {
  screen: string,
  params?: { [key: string]: any },
};

export default function AccountActions({ account, parentAccount }: Props) {
  const { colors } = useTheme();
  const [displayedActions, setDisplayedActions] = useState();
  const navigation = useNavigation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const mainAccount = getMainAccount(account, parentAccount);
  const decorators = perFamilyAccountActions[mainAccount.currency.family];

  const accountId = account.id;
  const parentId = parentAccount && parentAccount.id;

  const SendAction = (decorators && decorators.SendAction) || SendActionDefault;

  const ReceiveAction =
    (decorators && decorators.ReceiveAction) || ReceiveActionDefault;

  const onNavigate = useCallback(
    (name: string, options?: NavOptions) => {
      setDisplayedActions();
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

  const actions = {
    default: useActions({ account, parentAccount, colors }),
    lending: useLendingActions({ account }),
  };

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

  return (
    <View style={styles.root}>
      {!readOnlyModeEnabled && (
        <SendAction
          account={account}
          parentAccount={parentAccount}
          style={[styles.btn]}
          onPress={onSend}
        />
      )}
      <ReceiveAction
        account={account}
        parentAccount={parentAccount}
        style={[styles.btn]}
        onPress={onReceive}
      />
      {actions.default && actions.default.length > 0 && (
        <>
          <Button
            event="AccountSend"
            type="primary"
            IconLeft={Transfer}
            onPress={() => setDisplayedActions("default")}
            title={null}
            containerStyle={styles.actionBtn}
          />
          <BottomModal
            isOpened={!!displayedActions}
            onClose={() => setDisplayedActions()}
            containerStyle={styles.modal}
          >
            {displayedActions === "lending" && (
              <LendingBanners account={account} />
            )}
            {!!displayedActions &&
              actions[displayedActions].map((a, i) =>
                a.Component ? (
                  <a.Component key={i} />
                ) : (
                  <ChoiceButton
                    key={i}
                    onSelect={({ navigationParams, enableActions }) => {
                      if (navigationParams) {
                        onNavigate(...navigationParams);
                      }
                      if (enableActions) {
                        setDisplayedActions(enableActions);
                      }
                    }}
                    {...a}
                  />
                ),
              )}
          </BottomModal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  modal: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  actionBtn: {
    flexBasis: 50,
    marginHorizontal: 4,
    paddingHorizontal: 6,
  },
  btn: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 6,
  },
});
