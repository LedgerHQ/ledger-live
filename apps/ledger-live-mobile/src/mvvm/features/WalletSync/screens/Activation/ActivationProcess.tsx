import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { memberCredentialsSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useSelector } from "~/context/hooks";
import { useFollowInstructions } from "../FollowInstructions/useFollowInstructions";
import WalletSyncActivationDeviceSelection from "../DeviceSelection";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import FollowInstructionsDrawer from "./ActivationInstructionDrawer";
import { LedgerSyncIntentStepLWM } from "../../deviceIntents/LedgerSyncIntentStepLWM";
import { useActivationDeviceIntentStepViewModel } from "./useActivationDeviceIntentStepViewModel";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

export function ActivationProcess(props: Props) {
  const ledgerSyncDie = useFeature("lwmLedgerSyncDie");
  return ledgerSyncDie?.enabled ? (
    <ActivationDeviceIntentStep />
  ) : (
    <ActivationDeviceSelectionProcess {...props} />
  );
}

// A direct entry can arrive before the navigator created the member credentials.
function ActivationDeviceIntentStep() {
  const memberCredentials = useSelector(memberCredentialsSelector);
  if (!memberCredentials) {
    return (
      <Flex flex={1} alignItems="center" justifyContent="center">
        <InfiniteLoader size={50} />
      </Flex>
    );
  }
  return <ActivationDeviceIntentRun />;
}

function ActivationDeviceIntentRun() {
  return <LedgerSyncIntentStepLWM step={useActivationDeviceIntentStepViewModel()} />;
}

function ActivationDeviceSelectionProcess({ route, navigation }: Props) {
  const { isDrawerInstructionsVisible, closeDrawer, openDrawer, device } = useFollowInstructions();
  const { device: defaultDevice } = route.params || {};

  return (
    <>
      <WalletSyncActivationDeviceSelection
        navigation={navigation}
        route={route}
        goToFollowInstructions={openDrawer}
        defaultDevice={defaultDevice}
      />
      {isDrawerInstructionsVisible && (
        <FollowInstructionsDrawer
          isOpen={isDrawerInstructionsVisible}
          handleClose={closeDrawer}
          device={device}
        />
      )}
    </>
  );
}
