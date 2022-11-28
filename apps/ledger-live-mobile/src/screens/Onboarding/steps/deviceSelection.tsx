import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { Text, ScrollListContainer, Flex } from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { TrackScreen } from "../../../analytics";
import { ScreenName, NavigatorName } from "../../../const";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import {
  BaseNavigationComposite,
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "../../../components/RootNavigator/types/helpers";

import nanoSSvg from "../assets/nanoS";
import nanoSPSvg from "../assets/nanoSP";
import nanoXSvg from "../assets/nanoX";
import DiscoverCard from "../../Discover/DiscoverCard";
import DeviceSetupView from "../../../components/DeviceSetupView";
import { RootStackParamList } from "../../../components/RootNavigator/types/RootNavigator";
import { NavigateInput } from "../../../components/RootNavigator/types/BaseNavigator";

const nanoX = {
  SvgDevice: nanoXSvg,
  id: DeviceModelId.nanoX,
  setupTime: 600000,
};
const nanoS = {
  SvgDevice: nanoSSvg,
  id: DeviceModelId.nanoS,
  setupTime: 600000,
};
const nanoSP = {
  SvgDevice: nanoSPSvg,
  id: DeviceModelId.nanoSP,
  setupTime: 600000,
};
const nanoFTS = {
  SvgDevice: nanoXSvg,
  id: DeviceModelId.nanoFTS,
  setupTime: 300000,
};

type NavigationProp = RootNavigationComposite<
  BaseNavigationComposite<
    StackNavigatorNavigation<
      OnboardingNavigatorParamList,
      ScreenName.OnboardingDeviceSelection
    >
  >
>;

function OnboardingStepDeviceSelection() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const syncOnboarding = useFeature("syncOnboarding" as const);

  const devices = useMemo(() => {
    if (syncOnboarding?.enabled) {
      return [nanoFTS, nanoX, nanoSP, nanoS];
    }
    return [nanoX, nanoSP, nanoS];
  }, [syncOnboarding?.enabled]);

  const getProductName = (modelId: DeviceModelId) =>
    getDeviceModel(modelId)?.productName || modelId;

  const next = (deviceModelId: DeviceModelId) => {
    // Add NanoX.id, NanoSP.id etc, to the array when supported
    if ([nanoFTS.id].includes(deviceModelId)) {
      const navigateInput: NavigateInput<RootStackParamList> = {
        name: NavigatorName.BaseOnboarding,
        params: {
          screen: NavigatorName.SyncOnboarding,
          params: {
            screen: ScreenName.SyncOnboardingCompanion,
            params: {
              // @ts-expect-error BleDevicePairingFlow will set this param
              device: null,
            },
          },
        },
      };
      // On pairing success, navigate to the Sync Onboarding Companion
      // navigation.push on stack navigation because with navigation.navigate
      // it could not go back to this screen in certain cases.
      navigation.push(NavigatorName.Base, {
        screen: ScreenName.BleDevicePairingFlow,
        params: {
          // TODO: for now we remove this
          // filterByDeviceModelId: DeviceModelId.nanoFTS,
          areKnownDevicesDisplayed: true,
          onSuccessAddToKnownDevices: false,
          onSuccessNavigateToConfig: {
            // navigation.push on success because it could not correctly
            // go back to the previous screens (BLE and then this screen).
            navigationType: "push",
            navigateInput,
            pathToDeviceParam: "params.params.params.device",
          },
        },
      });
    } else {
      // TODO: FIX @react-navigation/native using Typescript
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore next-line
      navigation.navigate(ScreenName.OnboardingUseCase, {
        deviceModelId,
      });
    }
  };

  return (
    <DeviceSetupView hasBackButton>
      <ScrollListContainer flex={1} mx={6}>
        <TrackScreen category="Onboarding" name="SelectDevice" />
        <Text variant="h4" mb={3} fontWeight="semiBold">
          {t("syncOnboarding.deviceSelection.title")}
        </Text>
        <Text variant="large" color="neutral.c70" mb={8}>
          {t("syncOnboarding.deviceSelection.subtitle")}
        </Text>
        {devices.map(device => (
          <DiscoverCard
            key={device.id}
            event="Onboarding Device - Selection"
            eventProperties={{ id: device.id }}
            testID={`Onboarding Device - Selection|${device.id}`}
            title={getProductName(device.id)}
            titleProps={{ variant: "h4", fontSize: 16 }}
            subTitle={t("syncOnboarding.deviceSelection.brand")}
            subtitleFirst
            subTitleProps={{ mb: 0 }}
            onPress={() => next(device.id)}
            labelBadge={t("syncOnboarding.deviceSelection.setupTime", {
              time: device.setupTime / 60000,
            })}
            cardProps={{ mx: 0, mb: 6 }}
            Image={
              <Flex mr={12} mt={4} flex={1}>
                <device.SvgDevice fill={colors.neutral.c100} width={40} />
              </Flex>
            }
          />
        ))}
      </ScrollListContainer>
    </DeviceSetupView>
  );
}

export default OnboardingStepDeviceSelection;
