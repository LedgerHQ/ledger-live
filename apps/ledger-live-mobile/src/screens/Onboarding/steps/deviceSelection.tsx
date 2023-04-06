import React, { useMemo } from "react";
import { Image } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Text, ScrollListContainer } from "@ledgerhq/native-ui";
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
import DeviceSetupView from "../../../components/DeviceSetupView";
import { RootStackParamList } from "../../../components/RootNavigator/types/RootNavigator";
import { NavigateInput } from "../../../components/RootNavigator/types/BaseNavigator";
import ChoiceCard from "./ChoiceCard";

const nanoX = {
  source: require("../../../../assets/images/devices/NanoXCropped.png"),
  id: DeviceModelId.nanoX,
  setupTime: 600000,
};
const nanoS = {
  source: require("../../../../assets/images/devices/NanoSCropped.png"),
  id: DeviceModelId.nanoS,
  setupTime: 600000,
};
const nanoSP = {
  source: require("../../../../assets/images/devices/NanoSPCropped.png"),
  id: DeviceModelId.nanoSP,
  setupTime: 600000,
};
const stax = {
  source: require("../../../../assets/images/devices/StaxCropped.png"),
  id: DeviceModelId.stax,
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
  const syncOnboarding = useFeature("syncOnboarding" as const);

  const devices = useMemo(() => {
    if (syncOnboarding?.enabled) {
      return [stax, nanoX, nanoSP, nanoS];
    }
    return [nanoX, nanoSP, nanoS];
  }, [syncOnboarding?.enabled]);

  const getProductName = (modelId: DeviceModelId) =>
    getDeviceModel(modelId)?.productName || modelId;

  const next = (deviceModelId: DeviceModelId) => {
    // Add NanoX.id, NanoSP.id etc. when they will support the sync-onboarding
    if ([stax.id].includes(deviceModelId)) {
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
          filterByDeviceModelId: DeviceModelId.stax,
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
      navigation.navigate(ScreenName.OnboardingUseCase, {
        deviceModelId,
      });
    }
  };

  return (
    <DeviceSetupView hasBackButton>
      <ScrollListContainer flex={1} mx={6}>
        <TrackScreen category="Onboarding" name="SelectDevice" />
        <Text variant="h4" mb={7} fontWeight="semiBold">
          {t("syncOnboarding.deviceSelection.title")}
        </Text>
        {devices.map(device => (
          <ChoiceCard
            key={device.id}
            event="Onboarding Device - Selection"
            eventProperties={{ id: device.id }}
            testID={`onboarding-device-selection-${device.id}`}
            title={getProductName(device.id)}
            titleProps={{ variant: "large", fontWeight: "semiBold" }}
            onPress={() => next(device.id)}
            labelBadge={t("syncOnboarding.deviceSelection.setupTime", {
              time: device.setupTime / 60000,
            })}
            Image={
              <Image
                source={device.source}
                resizeMode="contain"
                style={{
                  height: "100%",
                  width: 140,
                }}
              />
            }
          />
        ))}
      </ScrollListContainer>
    </DeviceSetupView>
  );
}

export default OnboardingStepDeviceSelection;
