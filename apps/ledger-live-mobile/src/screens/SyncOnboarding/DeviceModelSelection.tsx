import React, { useCallback } from "react";
import { NativeModules } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";
// TODO: to put OnboardingView in components/move it in root ?
import DiscoverCard from "../Discover/DiscoverCard";
import Illustration from "../../images/illustration/Illustration";

const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "DeviceModelSelection"
>;

export const DeviceModelSelection = ({ navigation }: Props) => {
  const { t } = useTranslation();

  const setupNanoFTS = useCallback(() => {
    // Prompts user to enable bluetooth. Not necessary as next screen handles the ble requirement, but it smooths the transition
    NativeModules.BluetoothHelperModule.prompt()
      .then(() =>
        navigation.navigate(
          ScreenName.BleDevicesScanning as "BleDevicesScanning",
        ),
      )
      .catch(() => {
        // ignore
      });
  }, [navigation]);

  const handleNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
