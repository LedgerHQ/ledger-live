import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useICPNeuronById } from "@ledgerhq/live-common/families/internet_computer/react";
import type {
  ICPAccount,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import invariant from "invariant";
import React, { useCallback } from "react";
import { renderLoading } from "~/components/DeviceAction/rendering";
import SafeAreaView from "~/components/SafeAreaView";
import TranslatedError from "~/components/TranslatedError";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import ICPConnectDevice from "../components/ConnectDevice";
import MissingNeuron from "./MissingNeuron";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronConnectDevice
>;

const CATEGORY = "Manage Neurons ICP Flow";

/**
 * The device screen for the neuron flow, which asks the bridge before the device does.
 *
 * The screens that collect input are stopped by their own footer, but the actions that go straight
 * from a button to the device — disburse, spawn, the dissolve toggles, stake maturity, refresh
 * voting power, auto-stake, remove hot key — answer to nothing on the way here. Either kind can
 * also have its neuron change between the screen that offered the action and this one. Without
 * this the refusal arrives from the canister, one device confirmation later.
 *
 * The gate sits here rather than on a screen of its own before SelectDevice because retrying from
 * ValidationError has no entry for the direct commands and falls back to `goBack`, which lands on
 * SelectDevice — so a screen placed there would be skipped on every retry. This wrapper is under
 * the first attempt and every retry alike.
 */
export default function ConnectDevice(props: Props) {
  const { navigation, route } = props;
  const { t } = useTranslation();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "internet_computer account required");

  const icpAccount = account as ICPAccount;
  const { accountId, parentId, neuronId } = route.params;
  // `useICPNeuronById` matches on the id as a string, so the empty string of a list_neurons route
  // finds nothing — which is why the branch below returns before the result is read.
  const neuron = useICPNeuronById(icpAccount, neuronId ?? "");
  const bridge = useAccountBridge<Transaction>(icpAccount);
  const { status, bridgePending, bridgeError } = useBridgeTransaction<Transaction>(bridge, () => ({
    account: icpAccount,
    transaction: route.params.transaction,
  }));

  const backToList = useCallback(
    () => navigation.navigate(ScreenName.InternetComputerNeuronList, { accountId, parentId }),
    [accountId, navigation, parentId],
  );

  // `list_neurons` refreshes the whole account and names no neuron, so there is nothing to gate.
  if (neuronId === undefined) return <ICPConnectDevice {...props} category={CATEGORY} />;

  if (!neuron) return <MissingNeuron onBackToList={backToList} />;

  // Held rather than passed through: DeviceAction starts talking to the device on mount, so
  // unmounting it once a verdict arrives would interrupt an exchange already under way.
  if (bridgePending) return renderLoading({ t });

  const objection = bridgeError ?? Object.values(status.errors)[0];
  if (!objection) return <ICPConnectDevice {...props} category={CATEGORY} />;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <Flex flex={1} p={6} justifyContent="center" style={{ gap: 16 }} testID="icp-blocked-action">
        <Flex style={{ gap: 4 }}>
          {/* Translated rather than `error.message`: every ICP error class defaults its message to
              its own name, so the raw message renders as "ICPDisburseNotAllowed" at the user. */}
          <Text variant="body" fontWeight="semiBold" color="error.c50" textAlign="center">
            <TranslatedError error={objection} />
          </Text>
          <Text variant="small" color="error.c50" textAlign="center">
            <TranslatedError error={objection} field="description" />
          </Text>
        </Flex>
        <Button type="main" onPress={backToList} testID="icp-blocked-action-back-button">
          {t("internetComputer.manageNeuronFlow.confirmation.backToNeurons")}
        </Button>
      </Flex>
    </SafeAreaView>
  );
}
