import React, { useCallback, useState, memo } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Trans } from "~/context/Locale";
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
import { useAppDeviceAction, useSelectDevice } from "~/hooks/deviceActions";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { SafeAreaView } from "react-native-safe-area-context";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    WalletSyncNavigatorStackParamList,
    ScreenName.WalletSyncActivationProcess | ScreenName.WalletSyncManageInstancesProcess
  >
>;

type Props = NavigationProps;

// Defines here some of the header options for this screen to be able to reset back to them.
export const headerOptions: ReactNavigationHeaderOptions = {
  headerShown: false,
};

type ChooseDeviceProps = Props & {
  isFocused?: boolean;
  goToFollowInstructions: (device: Device) => void;
  /*
   * Sometimes we navigate to selection with a device that we already know
   * we want to connect to
   */
  defaultDevice?: Device;
};

const request = {
  appName: TRUSTCHAIN_APP_NAME,
};

const WalletSyncActivationDeviceSelection: React.FC<ChooseDeviceProps> = ({
  goToFollowInstructions,
  defaultDevice,
}) => {
  const isFocused = useIsFocused();
  const action = useAppDeviceAction();
  const { device, selectDevice, registerDeviceSelection } = useSelectDevice(defaultDevice);
  const [isHeaderOverridden, setIsHeaderOverridden] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProps["navigation"]>();

  const onClose = () => selectDevice(null);

  const onResult = useCallback(
    (payload: AppResult) => {
      // clear device state so the DeviceActionModal closes cleanly and BLE scanning can restart
      selectDevice(null);
      goToFollowInstructions(payload.device);
    },
    [goToFollowInstructions, selectDevice],
  );

  const onError = (error: Error) => {
    // Both the old (SelectDevice) and new (SelectDevice2) device selection components handle the bluetooth requirements with a hook + bottom drawer.
    // By setting back the device to `undefined` it gives back the responsibilities to those select components to check for the bluetooth requirements
    // and avoids a duplicated error drawers/messages.
    // The only drawback: the user has to select again their device once the bluetooth requirements are respected.
    if (error instanceof BluetoothRequired) {
      selectDevice(undefined);
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
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1 }}>
      <TrackScreen category="Manager" name="ChooseDevice" />
      {!isHeaderOverridden ? (
        <Flex px={16} pb={8}>
          <Text fontWeight="semiBold" variant="h4">
            <Trans i18nKey="walletSync.deviceSelection.title" />
          </Text>
        </Flex>
      ) : null}
      <Flex flex={1} mb={8}>
        <SelectDevice2
          onSelect={selectDevice}
          stopBleScanning={!!device || !isFocused}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        onClose={onClose}
        device={device}
        onResult={onResult}
        action={action}
        request={request}
        onError={onError}
        registerDeviceSelection={registerDeviceSelection}
        location={HOOKS_TRACKING_LOCATIONS.ledgerSyncFlow}
      />
    </SafeAreaView>
  );
};

export default memo(WalletSyncActivationDeviceSelection);
