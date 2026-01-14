import React from "react";
import { useFollowInstructions } from "../FollowInstructions/useFollowInstructions";
import WalletSyncActivationDeviceSelection from "../DeviceSelection";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import DeletionFollowInstructionsDrawer from "./DeletionInstructionDrawer";

type Props = BaseComposite<
  StackNavigatorProps<
    WalletSyncNavigatorStackParamList,
    ScreenName.WalletSyncManageInstancesProcess
  >
>;

export function ManageInstancesProcess({ route, navigation }: Props) {
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
