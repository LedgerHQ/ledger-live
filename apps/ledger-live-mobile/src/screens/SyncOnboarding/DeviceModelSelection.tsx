import React, { useCallback } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { NavigatorName, ScreenName } from "../../const";
// TODO: to put OnboardingView in components/move it in root ?
import OnboardingView from "../Onboarding/OnboardingView";
import DiscoverCard from "../Discover/DiscoverCard";
import Illustration from "../../images/illustration/Illustration";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/BaseNavigator";

const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

type Props = CompositeScreenProps<
  StackScreenProps<SyncOnboardingStackParamList, "DeviceModelSelection">,
  StackScreenProps<BaseNavigatorStackParamList>
>;

export const DeviceModelSelection = ({ navigation }: Props) => {
  // const { t } = useTranslation();

  const setupNanoFTS = useCallback(() => {
    // On pairing success, navigate to the Sync Onboarding Companion
    navigation.navigate(NavigatorName.Base as "Base", {
      screen: ScreenName.BleDevicePairingFlow as "BleDevicePairingFlow",
      params: {
        filterByDeviceModelId: DeviceModelId.nanoFTS,
        areKnownDevicesDisplayed: false,
        onSuccessAddToKnownDevices: false,
        onSuccessNavigateToConfig: {
          navigateInput: {
            name: NavigatorName.BaseOnboarding,
            params: {
              screen: NavigatorName.SyncOnboarding,
              params: {
                screen: ScreenName.SyncOnboardingCompanion,
                params: {
                  device: null,
                },
              },
            },
          },
          pathToDeviceParam: "params.params.params.device",
        },
      },
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
};
