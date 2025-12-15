import React from "react";
import { useFollowInstructions } from "../FollowInstructions/useFollowInstructions";
import WalletSyncActivationDeviceSelection from "../DeviceSelection";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import FollowInstructionsDrawer from "./ActivationInstructionDrawer";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

export function ActivationProcess({ route, navigation }: Props) {
  const { isDrawerInstructionsVisible, closeDrawer, openDrawer, device } = useFollowInstructions();
  const { device: preselectedDevice } = route.params || {};

  return (
    <>
      <WalletSyncActivationDeviceSelection
        navigation={navigation}
        route={route}
        goToFollowInstructions={openDrawer}
        preselectedDevice={preselectedDevice}
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
