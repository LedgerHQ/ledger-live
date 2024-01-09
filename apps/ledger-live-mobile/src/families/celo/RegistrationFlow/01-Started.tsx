import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction as CeloTransaction } from "@ledgerhq/live-common/families/celo/types";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import LText from "~/components/LText";
import TranslatedError from "~/components/TranslatedError";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CeloRegistrationFlowParamList } from "./types";

type Props = StackNavigatorProps<CeloRegistrationFlowParamList, ScreenName.CeloRegistrationStarted>;

export default function RegisterAccountStarted({ navigation, route }: Props) {
  const { colors } = useTheme();

  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account needed");

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);

  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);

    const transaction = bridge.updateTransaction(t, {
      mode: "register",
    });

    return { account, transaction };
  });

  invariant(transaction, "transaction required");

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CeloRegistrationSelectDevice, {
      ...route.params,
      transaction: transaction as CeloTransaction,
    });
  }, [navigation, route.params, transaction]);

  const error =
    status.errors && Object.keys(status.errors).length > 0 && Object.values(status.errors)[0];

  const warning =
    status.warnings && Object.keys(status.warnings).length > 0 && Object.values(status.warnings)[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={styles.scroll}
        // FIXME: PROP DOESN'T EXIST ON View BUT DOES ON ScrollView
        // contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen
          category="CeloRegistrationFlow"
          name="Started"
          flow="stake"
          action="registration"
          currency="celo"
        />
        <Text fontWeight="semiBold" style={styles.title}>
          <Trans i18nKey="celo.register.flow.steps.started.description" />
        </Text>
      </View>
      <View style={styles.warningSection}>
        {error && error instanceof Error ? (
          <LText selectable secondary semiBold style={styles.warning} color="alert">
            <TranslatedError error={error} />
          </LText>
        ) : warning && warning instanceof Error ? (
          <LText selectable secondary semiBold style={styles.warning} color="alert">
            <TranslatedError error={warning} />
          </LText>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button
          disabled={error instanceof Error}
          event="RegisterAccountBtn"
          onPress={onNext}
          title={<Trans i18nKey="common.continue" />}
          type="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    lineHeight: 33,
    padding: 16,
  },
  footer: {
    padding: 16,
  },
  warning: {
    textAlign: "center",
  },
  warningSection: { padding: 16, height: 80 },
});
