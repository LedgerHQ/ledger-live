import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { Flex, IconBox, IconsLegacy, Log, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { TrackScreen, track } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import SafeAreaViewFixed from "~/components/SafeAreaView";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import SyncFooter from "../components/SyncFooter";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronValidationSuccess
  >
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { ticker } = getAccountCurrency(account);
  const { transaction, result } = route.params;

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const lastUpdatedMSecs = mainAccount.neurons?.lastUpdatedMSecs;

  const isListNeurons = transaction?.type === "list_neurons";

  // Create list_neurons transaction for sync
  const { transaction: syncTransaction, status: syncStatus } = useBridgeTransaction(() => {
    const tx = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(tx, {
        type: "list_neurons",
      }),
    };
  });

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onCloseListNeurons = useCallback(() => {
    // For list_neurons, go back to NeuronList to show updated neurons
    navigation.navigate(ScreenName.InternetComputerNeuronList, {
      accountId: route.params.accountId,
      source: route.params.source,
    });
  }, [navigation, route.params]);

  const onSync = useCallback(() => {
    track("buttonClicked", { button: "sync_neurons", currency: "ICP" });
    if (!syncTransaction) return;

    // Navigate to device selection to sign list_neurons transaction
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      ...route.params,
      transaction: syncTransaction,
      status: syncStatus,
    });
  }, [navigation, route.params, syncTransaction, syncStatus]);

  const source = route.params.source?.name ?? "unknown";

  const actionText = useMemo(() => {
    const actionType = transaction?.type;
    if (!actionType) return t("icp.neuronManage.actionText.list_neurons");
    return t(`icp.neuronManage.actionText.${actionType}`, { defaultValue: actionType });
  }, [transaction?.type, t]);

  useEffect(() => {
    track("neuron_action_completed", {
      currency: ticker,
      source,
      flow: "manage",
      action: transaction?.type || "unknown",
    });
  }, [source, ticker, transaction?.type]);

  // For list_neurons, use the original ValidateSuccess component
  if (isListNeurons) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TrackScreen
          category="ICP Neuron Management"
          name="ValidationSuccess"
          flow="manage"
          action="list_neurons"
          currency="internet_computer"
        />
        <PreventNativeBack />
        <ValidateSuccess
          onClose={onCloseListNeurons}
          title={<Trans i18nKey="icp.neuronManage.syncSuccess.title" />}
          description={<Trans i18nKey="icp.neuronManage.syncSuccess.description" />}
        />
      </View>
    );
  }

  // For other actions, use custom screen with SuccessFooter
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="ValidationSuccess"
        flow="manage"
        action={transaction?.type || "neuron_management"}
        currency="internet_computer"
      />
      <PreventNativeBack />
      <SafeAreaViewFixed isFlex edges={["bottom"]} testID="validate-success-screen">
        <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center" px={6}>
          <IconBox
            Icon={IconsLegacy.CheckAloneMedium}
            color="success.c50"
            boxSize={64}
            iconSize={24}
          />
          <Flex py={8}>
            <Log>{t("icp.neuronManage.success.title", { action: actionText })}</Log>
          </Flex>
          <Text variant="body" fontWeight="medium" color="neutral.c70" mt={6} textAlign="center">
            <Trans i18nKey="icp.neuronManage.success.description" />
          </Text>
        </Flex>
        <SyncFooter lastUpdatedMSecs={lastUpdatedMSecs} onSync={onSync} onClose={onClose} />
      </SafeAreaViewFixed>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
