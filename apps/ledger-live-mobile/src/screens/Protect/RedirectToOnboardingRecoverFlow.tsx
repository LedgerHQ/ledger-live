import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { DeviceAlreadySetup } from "@ledgerhq/live-common/errors";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { FirmwareInfo } from "@ledgerhq/types-live";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getVersion from "@ledgerhq/live-common/hw/getVersion";
import { BleError } from "@ledgerhq/live-common/ble/types";
import { Flex, Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useHeaderHeight } from "@react-navigation/elements";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  OnboardingState,
  extractOnboardingState,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { first } from "rxjs/operators";
import { from } from "rxjs";
import { TrackScreen } from "~/analytics";
import { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import BleDevicePairingFlow from "~/components/BleDevicePairingFlow";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigationInterceptor } from "../Onboarding/onboardingContext";
import GenericErrorView from "~/components/GenericErrorView";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { urls } from "~/utils/urls";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.RedirectToOnboardingRecoverFlow>
>;

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
  const [device, setDevice] = useState<Device>();
  const [state, setState] = useState<OnboardingState>();
  const [error, setError] = useState<Error>();

  // redirect to correct onboarding if device is not seeded
  useEffect(() => {
    if (device && state && !state.isOnboarded) {
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
  }, [device, navigation, state]);

  // check if device is seeded when selected
  useEffect(() => {
    if (device) {
      const requestObservable = withDevice(device.deviceId)(t => from(getVersion(t))).pipe(first());

      const sub = requestObservable.subscribe({
        next: (firmware: FirmwareInfo) => {
          try {
            setState(extractOnboardingState(firmware.flags));
          } catch (error: unknown) {
            if (error instanceof Error) {
              setError(error);
            }
          }
        },
        error: (error: BleError) => {
          setError(error);
        },
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, [device]);

  const handleOnSelect = useCallback((device: Device) => {
    setDevice(device);
  }, []);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
          headerLeft: () => <NavigationHeaderBackButton onPress={goBack} />,
        });
      }
    },
    [goBack, navigation],
  );

  const onClickBuyLedger = useCallback(() => {
    Linking.openURL(urls.buyNanoX);
  }, []);

  const onRetry = useCallback(() => {
    setDevice(undefined);
    setState(undefined);
    setError(undefined);
  }, []);

  const savStyle = useMemo(
    () => ({
      flex: 1,
      backgroundColor: colors.background,
    }),
    [colors.background],
  );

  useEffect(() => {
    if (state?.isOnboarded) {
      navigation.setOptions({
        headerLeft: () => <NavigationHeaderBackButton onPress={goBack} />,
      });
    }
  }, [goBack, navigation, state?.isOnboarded]);

  // Handle error if present
  if (error) {
    return (
      <SafeAreaView edges={edges} style={savStyle}>
        <TrackScreen category="RedirectToRecoverOnboarding" name="Error handling" />
        <Flex px={16} py={5} flex={1} justifyContent="space-between">
          <Flex flex={1} justifyContent="center">
            <GenericErrorView
              error={error}
              withDescription
              hasExportLogButton={false}
              withHelp={false}
            />
          </Flex>

          <Flex mt={30} flexDirection="column" width="100%">
            <Button type="main" onPress={onRetry} mt={6}>
              <Trans i18nKey="common.retry" />
            </Button>
            <Button
              iconPosition="right"
              Icon={IconsLegacy.ExternalLinkMedium}
              onPress={onClickBuyLedger}
              mb={0}
            >
              <Trans i18nKey="help.helpCenter.desc" />
            </Button>
          </Flex>
        </Flex>
      </SafeAreaView>
    );
  }

  // Handle onboarded screen
  if (state?.isOnboarded) {
    return (
      <SafeAreaView edges={edges} style={savStyle}>
        <TrackScreen category="RedirectToRecoverOnboarding" name="Already seeded" />
        <Flex px={16} py={5} flex={1} justifyContent="space-between">
          <Flex flex={1} justifyContent="center">
            <GenericErrorView
              error={new DeviceAlreadySetup("", { device: device?.modelId ?? "device" })}
              hasExportLogButton={false}
              withHelp={false}
            />
          </Flex>

          <Flex mt={30} flexDirection="column" width="100%">
            <Button type="main" onPress={onRetry} mt={6}>
              <Trans i18nKey="DeviceAction.connectAnotherDevice" />
            </Button>
            <Button
              iconPosition="right"
              Icon={IconsLegacy.ExternalLinkMedium}
              onPress={onClickBuyLedger}
              mb={0}
            >
              <Trans i18nKey="onboarding.stepProtect.extraInfo.buyLedger" />
            </Button>
          </Flex>
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={savStyle}>
      <TrackScreen category="RedirectToRecoverOnboarding" name="PairingFlow" />
      <Flex px={16} py={5} marginTop={headerHeight} flex={1}>
        <BleDevicePairingFlow
          onPairingSuccess={handleOnSelect}
          onGoBackFromScanning={goBack}
          onPairingSuccessAddToKnownDevices
          areKnownDevicesPairable
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
    </SafeAreaView>
  );
}

const edges = ["bottom"] as Edge[];
