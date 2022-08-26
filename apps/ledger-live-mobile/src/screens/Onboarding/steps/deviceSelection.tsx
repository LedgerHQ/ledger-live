import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { StackActions, useNavigation } from "@react-navigation/native";
import { getDeviceModel } from "@ledgerhq/devices/lib/";
import { Flex, ScrollListContainer, Text } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ArrowLeftMedium, HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId } from "@ledgerhq/types-devices";

import { TrackScreen } from "../../../analytics";
import nanoSSvg from "../assets/nanoS";
import nanoSPSvg from "../assets/nanoSP";
import nanoXSvg from "../assets/nanoX";
import { ScreenName, NavigatorName } from "../../../const";
import DiscoverCard from "../../Discover/DiscoverCard";
import Illustration from "../../../images/illustration/Illustration";

const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

const nanoX = { SvgDevice: nanoXSvg, id: "nanoX", setupTime: 600000 };
const nanoS = { SvgDevice: nanoSSvg, id: "nanoS", setupTime: 600000 };
const nanoSP = { SvgDevice: nanoSPSvg, id: "nanoSP", setupTime: 600000 };
const nanoFTS = { SvgDevice: nanoXSvg, id: "nanoFTS", setupTime: 300000 };

const devices = [nanoFTS, nanoX, nanoSP, nanoS];

function OnboardingStepDeviceSelection() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getProductName = (modelId: string) =>
    getDeviceModel(modelId)?.productName || modelId;

  const handleBack = () => {
    navigation.dispatch(StackActions.popToTop());
  };

  const handleHelp = () => {
    // TOOD
  };

  const next = (deviceModelId: string) => {
    if (deviceModelId === "nanoFTS") {
      // TODO: do better
      // @ts-expect-error navigator typing issue
      navigation.navigate(NavigatorName.SyncOnboarding, {
        screen: ScreenName.BleDevicesScanning as "BleDevicesScanning",
        params: {
          filterByModelId: DeviceModelId.nanoFTS,
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
    <SafeAreaView
      style={[{ flex: 1 }, { backgroundColor: colors.background.main }]}
    >
      <Flex
        px={6}
        pt={8}
        mb={7}
        flexDirection="row"
        justifyContent="space-between"
      >
        <Flex>
          <TouchableOpacity onPress={handleBack}>
            <ArrowLeftMedium size={24} />
          </TouchableOpacity>
        </Flex>
        <Flex>
          <TouchableOpacity onPress={handleHelp}>
            <HelpMedium size={24} />
          </TouchableOpacity>
        </Flex>
      </Flex>
      <ScrollListContainer flex={1} px={6} bg="background.main">
        <Flex flex={1}>
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
              onPress={() => next(device.id)}
              labelBadge={t("syncOnboarding.deviceSelection.setupTime", {
                time: device.setupTime / 60000,
              })}
              cardProps={{ mx: 0, mb: 6 }}
              Image={
                <Illustration
                  size={130}
                  darkSource={setupLedgerImg}
                  lightSource={setupLedgerImg}
                />
              }
            />
          ))}
        </Flex>
      </ScrollListContainer>
      <TrackScreen category="Onboarding" name="SelectDevice" />
    </SafeAreaView>
  );
}

export default OnboardingStepDeviceSelection;
