import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFollowInstructions } from "../FollowInstructions/useFollowInstructions";
import WalletSyncActivationDeviceSelection from "../DeviceSelection";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import DeletionFollowInstructionsDrawer from "./DeletionInstructionDrawer";
import { LedgerSyncIntentStepLWM } from "../../deviceIntents/LedgerSyncIntentStepLWM";
import { useManageInstancesDeviceIntentStepViewModel } from "./useManageInstancesDeviceIntentStepViewModel";

type Props = BaseComposite<
  StackNavigatorProps<
    WalletSyncNavigatorStackParamList,
    ScreenName.WalletSyncManageInstancesProcess
  >
>;

export function ManageInstancesProcess(props: Props) {
  const ledgerSyncDie = useFeature("lwmLedgerSyncDie");
  return ledgerSyncDie?.enabled ? (
    <ManageInstancesDeviceIntentStep member={props.route.params.member} />
  ) : (
    <ManageInstancesDeviceSelectionProcess {...props} />
  );
}

function ManageInstancesDeviceIntentStep({ member }: Readonly<{ member: TrustchainMember }>) {
  return <LedgerSyncIntentStepLWM step={useManageInstancesDeviceIntentStepViewModel(member)} />;
}

function ManageInstancesDeviceSelectionProcess({ route, navigation }: Props) {
  const { isDrawerInstructionsVisible, closeDrawer, openDrawer, device } = useFollowInstructions();

  const member = route.params?.member;

  return (
    <>
      <WalletSyncActivationDeviceSelection
        navigation={navigation}
        route={route}
        goToFollowInstructions={openDrawer}
      />
      {isDrawerInstructionsVisible && (
        <DeletionFollowInstructionsDrawer
          isOpen={isDrawerInstructionsVisible}
          handleClose={closeDrawer}
          device={device}
          member={member}
        />
      )}
    </>
  );
}
