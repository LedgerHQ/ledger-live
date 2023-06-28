import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult, createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Flex } from "@ledgerhq/native-ui";
import { useHeaderHeight } from "@react-navigation/elements";
import { DeviceModelId } from "@ledgerhq/devices";
import { TrackScreen } from "../../analytics";
import { SetHeaderOptionsRequest } from "../../components/SelectDevice2";
import DeviceActionModal from "../../components/DeviceActionModal";
import { RootComposite, StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import BleDevicePairingFlow from "../../components/BleDevicePairingFlow";
import { NavigatorName, ScreenName } from "../../const";
import { useNavigationInterceptor } from "../Onboarding/onboardingContext";

const action = createAction(connectApp);

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.RedirectToOnboardingRecoverFlow>
>;

const request = {
  appName: "BOLOS",
};

export function RedirectToOnboardingRecoverFlowScreen({ navigation }: NavigationProps) {
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();

  // Not sure we need this,
  // probably needed if we can use a deeplink
  // to arrive here without having setup LL before
  useEffect(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
  }, [setFirstTimeOnboarding, setShowWelcome]);

  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const [device, setDevice] = useState<Device | null | undefined>();

  const onDone = useCallback(() => {
    if (device) {
      if (device.modelId === DeviceModelId.stax) {
        navigation.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.SyncOnboarding,
          params: {
            screen: ScreenName.SyncOnboardingCompanion,
            params: {
              device,
            },
          },
        });
      } else {
        navigation.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.Onboarding,
          params: {
            screen: ScreenName.OnboardingProtectFlow,
            params: {
              deviceModelId: device.modelId,
            },
          },
        });
      }
    }
  }, [device, navigation]);

  const handleSuccess = useCallback(
    (result: AppResult) => {
      // check if the device is seeded or not
      if (result) {
        onDone();
      }
    },
    [onDone],
  );

  const resetDevice = useCallback(() => {
    setDevice(undefined);
  }, []);

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
        });
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions({
          headerLeft: () => null,
          headerRight: () => null,
        });
      }
    },
    [navigation],
  );

  const handleOnSelect = useCallback((device: Device) => {
    setDevice(device);
  }, []);

  const closeBlePairingFlow = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const savStyle = useMemo(
    () => ({
      flex: 1,
      backgroundColor: colors.background,
    }),
    [colors.background],
  );

  return (
    <SafeAreaView edges={edges} style={savStyle}>
      <TrackScreen category="DeviceConnect" name="ConnectDevice" />
      <Flex px={16} py={5} marginTop={headerHeight} flex={1}>
        <BleDevicePairingFlow
          onPairingSuccess={handleOnSelect}
          onGoBackFromScanning={closeBlePairingFlow}
          onPairingSuccessAddToKnownDevices
          areKnownDevicesPairable
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={handleSuccess}
        onClose={resetDevice}
        request={request}
        analyticsPropertyFlow={"recoverRestore"}
      />
    </SafeAreaView>
  );
}

const edges = ["bottom"] as Edge[];
