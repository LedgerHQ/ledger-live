import React, { useCallback } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { CompositeScreenProps } from "@react-navigation/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { NavigatorName, ScreenName } from "../../const";
import DiscoverCard from "../Discover/DiscoverCard";
import Illustration from "../../images/illustration/Illustration";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/BaseNavigator";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

type Props = CompositeScreenProps<
  StackScreenProps<SyncOnboardingStackParamList, "DeviceModelSelection">,
  StackScreenProps<BaseNavigatorStackParamList>
>;

export const DeviceModelSelection = ({ navigation }: Props) => {
  const { t } = useTranslation();

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

  const handleNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const setupNanoX = () => {};

  return (
    <SafeAreaView>
      <Flex bg="background.main" height="100%">
        <Flex flexDirection="row" justifyContent="space-between">
          <Button
            Icon={ArrowLeftMedium}
            size="medium"
            onPress={handleNavigateBack}
          />
        </Flex>

        <Flex px={3}>
          <Text mb={4} mt={2} variant="h4" fontWeight="semiBold">
            {t("syncOnboarding.deviceSelection.title")}
          </Text>
          <Text mb={8}>{t("syncOnboarding.deviceSelection.subtitle")}</Text>
          <DiscoverCard
            title={t("syncOnboarding.deviceSelection.nanoFTS.title")}
            titleProps={{ variant: "h3" }}
            subTitle={t("syncOnboarding.deviceSelection.nanoFTS.description")}
            onPress={setupNanoFTS}
            cardProps={{ mx: 0, mb: 4 }}
            Image={
              <Illustration
                size={130}
                darkSource={setupLedgerImg}
                lightSource={setupLedgerImg}
              />
            }
          />
          <DiscoverCard
            title={t("syncOnboarding.deviceSelection.nanoX.title")}
            titleProps={{ variant: "h3" }}
            subTitle={t("syncOnboarding.deviceSelection.nanoX.description")}
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
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};
