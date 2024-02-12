import invariant from "invariant";
import React, { useCallback } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type {
  AlgorandAccount,
  AlgorandTransaction,
} from "@ledgerhq/live-common/families/algorand/types";
import { useTheme } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import Button from "~/components/Button";
import LText from "~/components/LText";
import { accountScreenSelector } from "~/reducers/accounts";
import NavigationScrollView from "~/components/NavigationScrollView";
import { TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import TranslatedError from "~/components/TranslatedError";
import Illustration from "~/images/illustration/Illustration";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AlgorandClaimRewardsFlowParamList } from "./type";
import { useSettings } from "~/hooks";

type Props = StackNavigatorProps<
  AlgorandClaimRewardsFlowParamList,
  ScreenName.AlgorandClaimRewardsStarted
>;

export default function DelegationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { locale } = useSettings();
  invariant(account, "Account required");
  const mainAccount = getMainAccount(account, undefined) as AlgorandAccount;
  const bridge = getAccountBridge(mainAccount, undefined);
  invariant(mainAccount && mainAccount.algorandResources, "algorand Account required");
  const { rewards } = mainAccount.algorandResources;
  const unit = getAccountUnit(mainAccount);
  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "claimReward",
      }),
    };
  });
  const formattedRewards = formatCurrencyUnit(unit, rewards, {
    showCode: true,
    disableRounding: true,
    locale: locale,
  });
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.AlgorandClaimRewardsSelectDevice, {
      ...route.params,
      transaction: transaction as AlgorandTransaction,
    });
  }, [navigation, route.params, transaction]);
  const warning =
    status.warnings && Object.keys(status.warnings).length > 0 && Object.values(status.warnings)[0];
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="DelegationFlow"
          name="Started"
          flow="stake"
          action="claim_rewards"
          currency="algo"
        />
        <Flex alignItems="center" justifyContent="center" mb={6}>
          <Illustration
            size={200}
            lightSource={require("~/images/illustration/Light/_003.png")}
            darkSource={require("~/images/illustration/Dark/_003.png")}
          />
        </Flex>
        <LText semiBold style={styles.description}>
          <Trans
            i18nKey="algorand.claimRewards.flow.steps.starter.title"
            values={{
              amount: formattedRewards,
            }}
          />
        </LText>
        <View style={styles.warning}>
          <Alert type="help">
            <Trans i18nKey="algorand.claimRewards.flow.steps.starter.warning" />
          </Alert>
        </View>
      </NavigationScrollView>
      <View style={[styles.footer]}>
        {warning && warning instanceof Error ? (
          <View style={styles.warningSection}>
            <LText selectable secondary semiBold style={styles.warningText} color="alert">
              <TranslatedError error={warning} />
            </LText>
          </View>
        ) : null}
        <Button
          event="DelegationStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="algorand.claimRewards.flow.steps.starter.cta" />}
          type="primary"
        />
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 16,
  },
  warning: {
    width: "100%",
    marginVertical: 8,
  },
  warningText: {
    textAlign: "center",
  },
  warningSection: {
    padding: 16,
    height: 80,
  },
  footer: {
    padding: 16,
  },
});
