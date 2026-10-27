import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { useTranslation } from "~/context/Locale";
import { Linking, Platform } from "react-native";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/isSyncOnboardingSupported";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import {
  BaseNavigationComposite,
  RootNavigationComposite,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { DeviceCards } from "./Cards/DeviceCard";
import OnboardingView from "./OnboardingView";
import { NotCompatibleModal } from "./setupDevice/drawers/NotCompatibleModal";
import { useFeature } from "@features/platform-feature-flags";

type ScreenProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingDeviceSelection
>;

type NavigationProp = RootNavigationComposite<BaseNavigationComposite<ScreenProps["navigation"]>>;

export const devices = {
  nanoX: {
    id: DeviceModelId.nanoX,
    img: require("../../../../assets/images/devices/NanoX.webp"),
    setupTime: 600000,
  },
  nanoS: {
    id: DeviceModelId.nanoS,
    img: require("../../../../assets/images/devices/NanoS.webp"),
    setupTime: 600000,
  },
  nanoSP: {
    id: DeviceModelId.nanoSP,
    img: require("../../../../assets/images/devices/NanoSP.webp"),
    setupTime: 600000,
  },
  stax: {
    id: DeviceModelId.stax,
    img: require("../../../../assets/images/devices/Stax.webp"),
    setupTime: 300000,
  },
  europa: {
    id: DeviceModelId.europa,
    img: require("../../../../assets/images/devices/Europa.webp"),
    setupTime: 300000,
  },
  apex: {
    id: DeviceModelId.apex,
    img: require("../../../../assets/images/devices/Apex.webp"),
    setupTime: 300000,
  },
};

const NOT_SUPPORTED_DEVICES_IOS = [DeviceModelId.nanoS, DeviceModelId.nanoSP];

function OnboardingStepDeviceSelection() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenProps["route"]>();
  const { t } = useTranslation();
  const missingDevice = route.params?.missingDevice === true;
  const pairingIssuesUrl = useLocalizedUrl(urls.pairingIssues);

  const isApexSupported = useFeature("supportDeviceApex")?.enabled ?? false;
  const availableDevices = [
    devices.stax,
    devices.europa,
    ...(isApexSupported ? [devices.apex] : []),
    devices.nanoX,
    devices.nanoSP,
    devices.nanoS,
  ];

  const [isOpen, setOpen] = useState<boolean>(false);

  const getProductName = (modelId: DeviceModelId) =>
    getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

  const next = (deviceModelId: DeviceModelId) => {
    // Touchscreen opens the pairing help article. Nano opens the old onboarding.
    if (missingDevice) {
      if (isSyncOnboardingSupported(deviceModelId)) {
        Linking.openURL(pairingIssuesUrl).catch(() => undefined);
        return;
      }
      navigation.navigate(ScreenName.OnboardingUseCase, { deviceModelId });
      return;
    }
    // Add NanoX.id, NanoSP.id etc. when they will support the sync-onboarding
    if (isSyncOnboardingSupported(deviceModelId)) {
      // On pairing success, navigate to the Sync Onboarding Companion
      // navigation.push on stack navigation because with navigation.navigate
      // it could not go back to this screen in certain cases.
      navigation.push(ScreenName.OnboardingBleDevicePairingFlow, {
        filterByDeviceModelId: deviceModelId,
      });
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
          id: device.id,
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
