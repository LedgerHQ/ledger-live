import React from "react";
import FollowInstructionsDrawer from "../FollowInstructions";
import { useFollowInstructions } from "../FollowInstructions/useFollowInstructions";
import WalletSyncActivationDeviceSelection from "../DeviceSelection";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

export function ActivationProcess({ route, navigation }: Props) {
  const {
    isDrawerInstructionsVisible,
    closeDrawer,
    openDrawer,

    device,
  } = useFollowInstructions();

  return (
    <>
      <WalletSyncActivationDeviceSelection
        navigation={navigation}
        route={route}
        goToFollowInstructions={openDrawer}
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
