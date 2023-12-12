import { getDeviceModel } from "@ledgerhq/devices/index";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import {
  BaseNavigationComposite,
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { DeviceCards } from "./Cards/DeviceCard";
import OnboardingView from "./OnboardingView";
import { NotCompatibleModal } from "./setupDevice/drawers/NotCompatibleModal";

type NavigationProp = RootNavigationComposite<
  BaseNavigationComposite<
    StackNavigatorNavigation<OnboardingNavigatorParamList, ScreenName.OnboardingDeviceSelection>
  >
>;

const devices = {
  nanoX: {
    id: DeviceModelId.nanoX,
    img: require("../../../../assets/images/devices/NanoX.png"),
    setupTime: 600000,
  },
  nanoS: {
    id: DeviceModelId.nanoS,
    img: require("../../../../assets/images/devices/NanoS.png"),
    setupTime: 600000,
  },
  nanoSP: {
    id: DeviceModelId.nanoSP,
    img: require("../../../../assets/images/devices/NanoSP.png"),
    setupTime: 600000,
  },
  stax: {
    id: DeviceModelId.stax,
    img: require("../../../../assets/images/devices/Stax.png"),
    setupTime: 300000,
  },
};

const NOT_SUPPORTED_DEVICES_IOS = [DeviceModelId.nanoS, DeviceModelId.nanoSP];

function OnboardingStepDeviceSelection() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const syncOnboarding = useFeature("syncOnboarding" as const);

  const [isOpen, setOpen] = useState<boolean>(false);

  const availableDevices = useMemo(() => {
    if (syncOnboarding?.enabled) {
      return [devices.stax, devices.nanoX, devices.nanoSP, devices.nanoS];
    }
    return [devices.nanoX, devices.nanoSP, devices.nanoS];
  }, [syncOnboarding?.enabled]);

  const getProductName = (modelId: DeviceModelId) =>
    getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

  const next = (deviceModelId: DeviceModelId) => {
    // Add NanoX.id, NanoSP.id etc. when they will support the sync-onboarding
    if ([devices.stax.id].includes(deviceModelId)) {
      // On pairing success, navigate to the Sync Onboarding Companion
      // navigation.push on stack navigation because with navigation.navigate
      // it could not go back to this screen in certain cases.
      navigation.push(ScreenName.OnboardingBleDevicePairingFlow);
    } else {
      navigation.navigate(ScreenName.OnboardingUseCase, {
        deviceModelId,
      });
    }
  };

  const closeDrawer = () => {
    setOpen(false);
  };

  const triggerNotCompatibleDrawer = () => {
    setOpen(true);
  };

  const isCompatible = (deviceModelId: DeviceModelId) =>
    Platform.OS !== "ios" ||
    (Platform.OS === "ios" && !NOT_SUPPORTED_DEVICES_IOS.includes(deviceModelId));

  return (
    <OnboardingView
      title={t("syncOnboarding.deviceSelection.title")}
      analytics={{ tracking: { category: "Onboarding", name: "SelectDevice" } }}
    >
      <DeviceCards
        cards={availableDevices.map(device => ({
          title: getProductName(device.id),
          img: device.img,
          compatible: isCompatible(device.id),
          onPress: () => (isCompatible(device.id) ? next(device.id) : triggerNotCompatibleDrawer()),
          event: "button_clicked",
          eventProperties: { button: device.id },
          testID: `onboarding-device-selection-${device.id}`,
        }))}
      />

      <NotCompatibleModal isOpen={isOpen} onClose={closeDrawer} />
    </OnboardingView>
  );
}

export default OnboardingStepDeviceSelection;
