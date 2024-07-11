import React, { useCallback, useMemo, useState } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BluetoothRequired } from "@ledgerhq/errors";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import TrackScreen from "~/analytics/TrackScreen";
import DeviceActionModal from "~/components/DeviceActionModal";
import {
  BaseComposite,
  ReactNavigationHeaderOptions,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";

import FollowInstructionsDrawer from "~/newArch/features/WalletSync/screens/FollowInstructions";

import { useAppDeviceAction } from "~/hooks/deviceActions";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { logDrawer } from "~/newArch/components/QueuedDrawer/utils/logDrawer";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    WalletSyncNavigatorStackParamList,
    ScreenName.WalletSyncActivationDeviceSelection
  >
>;

type Props = NavigationProps;

// Defines here some of the header options for this screen to be able to reset back to them.
export const headerOptions: ReactNavigationHeaderOptions = {
  headerShown: false,
};

type ChooseDeviceProps = Props & {
  isFocused: boolean;
};

const APP_NAME = "Ledger Sync";

const ChooseDevice: React.FC<ChooseDeviceProps> = ({ isFocused }) => {
  const request = useMemo(
    () => ({
      appName: APP_NAME,
    }),
    [],
  );
  const action = useAppDeviceAction();
  const [device, setDevice] = useState<Device | null>();
  const [isHeaderOverridden, setIsHeaderOverridden] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProps["navigation"]>();

  const onSelectDevice = (device?: Device) => {
    if (device) setDevice(device);
  };

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const openDrawer = useCallback(() => {
    setIsDrawerVisible(true);
    logDrawer("Follow Steps on device", "open");
  }, []);

  const onResult = useCallback(
    (payload: AppResult) => {
      setDevice(undefined);

      // Nb Unsetting device here caused the scanning to start again,
      // scanning causes a disconnect, which throws an error when we try to talk
      // to the device on the next step.
      openDrawer();
    },
    [openDrawer],
  );

  const closeDrawer = useCallback(() => {
    setIsDrawerVisible(false);
    logDrawer("Wallet Sync Welcome back", "close");
  }, []);

  const reopenDrawer = useCallback(() => {
    setIsDrawerVisible(true);
    logDrawer("Wallet Sync Welcome back", "reopen");
  }, []);

  const onModalHide = () => {
    setDevice(undefined);
  };

  const onError = (error: Error) => {
    // Both the old (SelectDevice) and new (SelectDevice2) device selection components handle the bluetooth requirements with a hook + bottom drawer.
    // By setting back the device to `undefined` it gives back the responsibilities to those select components to check for the bluetooth requirements
    // and avoids a duplicated error drawers/messages.
    // The only drawback: the user has to select again their device once the bluetooth requirements are respected.
    if (error instanceof BluetoothRequired) {
      setDevice(undefined);
    }
  };

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
          title: "",
        });
        setIsHeaderOverridden(true);
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions({
          headerLeft: () => null,
          headerRight: () => null,
          ...headerOptions,
        });
        setIsHeaderOverridden(false);
      }
    },
    [navigation],
  );

  if (!isFocused) return null;

  return (
    <>
      <TrackScreen category="Manager" name="ChooseDevice" />
      {!isHeaderOverridden ? (
        <Flex px={16} pb={8}>
          <Text fontWeight="semiBold" variant="h4">
            <Trans i18nKey="walletSync.deviceSelection.title" />
          </Text>

          <Text pt={3} fontWeight="medium" variant="bodyLineHeight" color="neutral.c70">
            <Trans i18nKey="walletSync.deviceSelection.description" />
          </Text>
        </Flex>
      ) : null}
      <Flex flex={1} mb={8}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={!!device}
          displayServicesWidget
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        onClose={() => onSelectDevice()}
        device={device}
        onResult={onResult}
        onModalHide={onModalHide}
        action={action}
        request={request}
        onError={onError}
      />

      <FollowInstructionsDrawer
        isOpen={isDrawerVisible}
        handleClose={closeDrawer}
        reopenDrawer={reopenDrawer}
      />
    </>
  );
};

export default function WalletSyncActivationDeviceSelection(props: Props) {
  const isFocused = useIsFocused();
  return <ChooseDevice {...props} isFocused={isFocused} />;
}
