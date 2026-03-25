import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import ActionFooter from "../components/ActionFooter";
import NeuronInfoCard from "../components/NeuronInfoCard";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronAddHotKey
  >
>;

export default function AddHotKey({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const unit = useAccountUnit(account);
  const { neuronId } = route.params;

  const [hotKey, setHotKey] = useState("");

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          type: "add_hot_key",
          neuronId,
          hotKeyToAdd: "",
        }),
      };
    },
  );

  invariant(transaction, "transaction must be defined");

  const onChangeHotKey = useCallback(
    (value: string) => {
      setHotKey(value);
      setTransaction(
        bridge.updateTransaction(transaction, {
          hotKeyToAdd: value,
        }),
      );
    },
    [bridge, setTransaction, transaction],
  );

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      source: route.params.source,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [account.id, navigation, parentAccount?.id, route.params.source, status, transaction]);

  const error = bridgePending || !hotKey ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const hasErrors = hasStatusError(status);

  const isDisabled = useMemo(() => {
    if (bridgePending || !!bridgeError) return true;
    if (!hotKey.trim()) return true;
    if (hasErrors && hotKey) return true;
    return false;
  }, [bridgePending, bridgeError, hotKey, hasErrors]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="AddHotKey"
        flow="manage"
        action="add_hot_key"
        currency="internet_computer"
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="h4" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.action.addHotKey.title" />
          </Text>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.action.addHotKey.description" />
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text variant="body" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.addHotKey.inputLabel" />
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: error ? colors.alert : colors.border },
            ]}
            value={hotKey}
            onChangeText={onChangeHotKey}
            placeholder="Enter Principal ID"
            placeholderTextColor={colors.border}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <NeuronInfoCard neuronId={neuronId} unit={unit} />
      </View>

      <ActionFooter
        error={error}
        warning={warning}
        onContinue={onContinue}
        isDisabled={isDisabled}
        isPending={bridgePending}
        testID="icp-neuron-add-hotkey-continue"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
});
