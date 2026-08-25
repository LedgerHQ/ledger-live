import { BaseInput, Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { TrackScreen } from "~/analytics";
import KeyboardView from "~/components/KeyboardView";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import ActionFooter from "../components/ActionFooter";
import { useNeuronAction } from "./useNeuronAction";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronAddHotKey
>;

/**
 * Grants another principal hot-key access to the neuron: it may vote and set following, but cannot
 * move the stake. The bridge validates the principal, so the field is free text here.
 */
export default function AddHotKey({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { transaction, updateTransaction, status, bridgePending, continueToDevice } =
    useNeuronAction(navigation, route);

  // Held locally so the field does not wait on a bridge round-trip; see SetDissolveDelay for why a
  // transaction-backed value loses keystrokes typed faster than the status refresh.
  const [hotKey, setHotKey] = useState(() => transaction?.hotKeyToAdd ?? "");

  const onChange = useCallback(
    (hotKeyToAdd: string) => {
      setHotKey(hotKeyToAdd);
      updateTransaction(tx => ({ ...tx, hotKeyToAdd }));
    },
    [updateTransaction],
  );

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="AddHotKey"
        flow="stake"
        action="add_hot_key"
      />
      <KeyboardView style={{ flex: 1 }}>
        <Flex flex={1} p={6} style={{ gap: 16 }}>
          <Text variant="body" color="neutral.c70">
            {t("internetComputer.manageNeuronFlow.addHotKey.description")}
          </Text>
          <Flex style={{ gap: 8 }}>
            <Text variant="small" fontWeight="semiBold" color="neutral.c70">
              {t("internetComputer.manageNeuronFlow.addHotKey.principal")}
            </Text>
            <BaseInput
              value={hotKey}
              onChange={onChange}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="aaaaa-aa"
              testID="icp-hot-key-input"
            />
          </Flex>
        </Flex>
      </KeyboardView>
      <ActionFooter
        status={status}
        bridgePending={bridgePending}
        onContinue={continueToDevice}
        canContinue={!!hotKey}
        pristineField={hotKey ? undefined : "transaction"}
      />
    </SafeAreaView>
  );
}
