import React, { useCallback, useEffect } from "react";
import { NativeModules } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  useBleDevicePairing,
  PairingError,
} from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicePairing";
import { ScannedDevice } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicesScanning";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices/lib/index";

import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";
import OnboardingView from "../Onboarding/OnboardingView";
import Illustration from "../../images/illustration/Illustration";
import RequiresBLE from "../../components/RequiresBLE";

const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

const TIMEOUT_AFTER_PAIRED_MS = 2000;

type Props = StackScreenProps<SyncOnboardingStackParamList, "BleDevicePairing">;

export const BleDevicePairing = ({ navigation, route }: Props) => {
  const { deviceToPair } = route.params;
  const { isPaired, pairingError } = useBleDevicePairing({
    deviceId: deviceToPair.deviceId,
  });

  useEffect(() => {
    if (isPaired) {
      setTimeout(() => {
        // Replace to avoid going back to this screen without re-rendering
        navigation.replace(
          ScreenName.SyncOnboardingCompanion as "SyncOnboardingCompanion",
          { device: deviceToPair },
        );
      }, TIMEOUT_AFTER_PAIRED_MS);
    }
  }, [isPaired, deviceToPair, navigation]);

  return (
    <RequiresBLE>
      <BleDevicePairingInner
        device={deviceToPair}
        isPaired={isPaired}
        pairingError={pairingError}
      />
    </RequiresBLE>
  );
};

const BleDevicePairingInner = ({
  device,
  isPaired,
  pairingError,
}: {
  device: Device;
  isPaired: boolean;
  pairingError: PairingError;
}) => {
  const { t } = useTranslation();

  const productName =
    getDeviceModel(device.modelId).productName || device.modelId;
  const deviceName = device.deviceName || productName;

  if (isPaired) {
    return (
      <OnboardingView
        title={`✅ ${t("syncOnboarding.pairing.success.title", {
          deviceName,
        })}`}
      >
        <Illustration
          size={300}
          darkSource={setupLedgerImg}
          lightSource={setupLedgerImg}
        />
      </OnboardingView>
    );
  }
  if (pairingError) {
    return (
      <OnboardingView
        hasCloseButton
        title={`❌ ${t("syncOnboarding.pairing.error.title")}`}
        subTitle={t("syncOnboarding.pairing.error.subtitle", { productName })}
      >
        <Illustration
          size={300}
          darkSource={setupLedgerImg}
          lightSource={setupLedgerImg}
        />
      </OnboardingView>
    );
  }

  return (
    <OnboardingView
      title={t("syncOnboarding.pairing.loading.title", { deviceName })}
      subTitle={t("syncOnboarding.pairing.loading.subtitle", { productName })}
    >
      <Illustration
        size={300}
        darkSource={setupLedgerImg}
        lightSource={setupLedgerImg}
      />
    </OnboardingView>
  );
};
