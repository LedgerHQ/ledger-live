import invariant from "invariant";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation, Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import type {
  Transaction as PolkadotTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Button, Alert, Text, Log } from "@ledgerhq/native-ui";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import TranslatedError from "~/components/TranslatedError";
import FlowErrorBottomModal from "../components/FlowErrorBottomModal";
import SendRowsFee from "../SendRowsFee";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PolkadotSimpleOperationFlowParamList } from "./types";

type Navigation = StackNavigatorProps<
  PolkadotSimpleOperationFlowParamList,
  ScreenName.PolkadotSimpleOperationStarted
>;

// returns the first error
function getStatusError(
  status: TransactionStatus,
  type: "errors" | "warnings" = "errors",
): Error | null {
  if (!status || !status[type]) return null;
  const firstKey = Object.keys(status[type])[0];
  return firstKey ? status[type][firstKey] : null;
}

export default function PolkadotSimpleOperationStarted({ navigation, route }: Navigation) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { mode } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);
  const { polkadotResources } = mainAccount as PolkadotAccount;
  invariant(polkadotResources, "polkadotResources required");
  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);
      const transaction = bridge.updateTransaction(t, {
        mode,
      });
      return {
        account: mainAccount,
        transaction,
      };
    },
  );
  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.PolkadotSimpleOperationSelectDevice, {
      accountId: account.id,
      mode,
      transaction: transaction as PolkadotTransaction,
      status,
    });
  }, [account, navigation, transaction, status, mode]);
  if (!account || !transaction) return null;
  const error = getStatusError(status, "errors");
  const warning = getStatusError(status, "warnings");
  const infoTranslated = t(`polkadot.simpleOperation.modes.${mode}.info`, {
    defaultValue: "",
  });
  const action = mode.replace(/([A-Z])/g, "_$1").toLowerCase();
  return (
    <>
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.container}>
          <TrackScreen
            category="SimpleOperationFlow"
            name="Started"
            flow="stake"
            action={action}
            currency="dot"
          />
          <View style={styles.content}>
            <Log>
              <Trans i18nKey={`polkadot.simpleOperation.modes.${mode}.description`} />
            </Log>
          </View>
        </View>
        <View style={styles.footer}>
          {infoTranslated ? <Alert type="info" title={infoTranslated} /> : null}
          {(error || warning) && (
            <Text
              style={[
                styles.footerMessage,
                warning && {
                  color: colors.orange,
                },
                error && {
                  color: colors.alert,
                },
              ]}
            >
              <TranslatedError error={error || warning} />
            </Text>
          )}
          <SendRowsFee account={account} transaction={transaction as PolkadotTransaction} />
          <Button type="main" onPress={onContinue} disabled={!!error || bridgePending}>
            <Trans i18nKey={!bridgePending ? "common.continue" : "send.amount.loadingNetwork"} />
          </Button>
        </View>
      </View>

      <FlowErrorBottomModal
        navigation={navigation}
        transaction={transaction as PolkadotTransaction}
        account={account}
        parentAccount={parentAccount}
        setTransaction={setTransaction}
        bridgeError={bridgeError}
      />
    </>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 22,
    lineHeight: 33,
    paddingVertical: 16,
  },
  info: {
    flexShrink: 0,
    width: "100%",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    textAlign: "right",
    flex: 1,
  },
  infoText: {
    textAlign: "left",
    marginLeft: 8,
  },
  footer: {
    padding: 16,
  },
  buttonContainer: {
    marginTop: 4,
  },
  footerMessage: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 12,
    paddingHorizontal: 6,
  },
});
