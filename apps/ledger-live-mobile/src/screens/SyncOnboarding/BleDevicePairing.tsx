import React, { useCallback, useEffect } from "react";
import { NativeModules } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { useBleDevicePairing, PairingError } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicePairing";
import { ScannedDevice } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicesScanning";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";
import OnboardingView from "../Onboarding/OnboardingView";
import Illustration from "../../images/illustration/Illustration";
import RequiresBLE from "../../components/RequiresBLE";

const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

const TIMEOUT_AFTER_PAIRED_MS = 2000;

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "BleDevicePairing"
>;

export const BleDevicePairing = ({ navigation, route }: Props) => {

  const { deviceToPair } = route.params;
  const { isPaired, pairingError } = useBleDevicePairing({ deviceId: deviceToPair.deviceId });

  console.log(`⏳ is paired ? ${isPaired} - Error ? ${JSON.stringify(pairingError)}`);

  useEffect(() => {
    if (isPaired) {
      setTimeout(() => {
        // Replace to avoid going back to this screen without re-rendering 
        navigation.replace(ScreenName.SyncOnboardingCompanion as "SyncOnboardingCompanion", { device: deviceToPair });
      }, TIMEOUT_AFTER_PAIRED_MS);
    }
  }, [isPaired, deviceToPair, navigation])
  
  return (
    <RequiresBLE>
      <BleDevicePairingInner device={deviceToPair} isPaired={isPaired} pairingError={pairingError}   />
    </RequiresBLE>
  );
}

const BleDevicePairingInner = ({device, isPaired, pairingError}: { device: Device, isPaired: boolean, pairingError: PairingError }) => {
    if (isPaired) {
      return (<OnboardingView
        title={`✅ Your ${device.modelId} is paired`}
        subTitle={`Ledger Live and ${device.deviceName} are now in sync.`}
      >
        <Illustration
          size={300}
          darkSource={setupLedgerImg}
          lightSource={setupLedgerImg}
        />
      </OnboardingView>);
    }
    if (pairingError) {
      return (<OnboardingView
        hasCloseButton
        title={`❌ Pairing unsuccessful`}
        subTitle={`There was a problem while pairing with your ${device.modelId} and your phone. Please check your bluetooth connection and try again`}
      >
        <Illustration
          size={300}
          darkSource={setupLedgerImg}
          lightSource={setupLedgerImg}
       />

      </OnboardingView>);
    }

    return (<OnboardingView
        title={`Pairing with ${device.deviceName}`}
        subTitle={`Confirm the code on your ${device.modelId} if it's the first pairing with your phone`}
      >
        <Illustration
          size={300}
          darkSource={setupLedgerImg}
          lightSource={setupLedgerImg}
       />

      </OnboardingView>)
  }
