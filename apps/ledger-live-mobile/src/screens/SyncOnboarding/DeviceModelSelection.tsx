import React, { useCallback } from "react";
import { NativeModules } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";
// TODO: to put OnboardingView in components/move it in root ?
import OnboardingView from "../Onboarding/OnboardingView";
import DiscoverCard from "../Discover/DiscoverCard";
import Illustration from "../../images/illustration/Illustration";

const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "DeviceModelSelection"
>;

export const DeviceModelSelection = ({ navigation }: Props) => {
  // const { t } = useTranslation();

  const setupNanoFTS = useCallback(() => {
    // Prompts user to enable bluetooth. Not necessary as next screen handles the ble requirement, but it smooths the transition
    NativeModules.BluetoothHelperModule.prompt()
      .then(() => navigation.navigate(ScreenName.BleDevicesScanning as "BleDevicesScanning"))
      .catch(() => {
      // ignore
    });
  }, [navigation]);

  const setupNanoX = () => {};

  return (
    <OnboardingView
      hasBackButton
      title="Which device do you own ?"
      subTitle="Choose which ledger wallet you want to set up with Ledger Live."
    >
      <DiscoverCard
        title="nanoFTS"
        titleProps={{ variant: "h3" }}
        subTitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        onPress={setupNanoFTS}
        cardProps={{ mx: 0 }}
        Image={
          <Illustration
            size={130}
            darkSource={setupLedgerImg}
            lightSource={setupLedgerImg}
          />
        }
      />
    
      <DiscoverCard
        title="Nano X"
        titleProps={{ variant: "h3" }}
        subTitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        onPress={setupNanoX}
        cardProps={{ mx: 0 }}
        Image={
          <Illustration
            size={130}
            darkSource={setupLedgerImg}
            lightSource={setupLedgerImg}
          />
        }
      />
    </OnboardingView>
  );
}
