import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import nanoSSvg from "../assets/nanoS";
import nanoSPSvg from "../assets/nanoSP";
import nanoXSvg from "../assets/nanoX";
import { ScreenName, NavigatorName } from "../../../const";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "../../../components/StyledStatusBar";
import ChoiceCard from "../../../components/ChoiceCard";

const nanoX = { SvgDevice: nanoXSvg, id: "nanoX" };
const nanoS = { SvgDevice: nanoSSvg, id: "nanoS" };
const nanoSP = { SvgDevice: nanoSPSvg, id: "nanoSP" };
const nanoFTS = { SvgDevice: nanoXSvg, id: "nanoFTS" };

const devices = [nanoX, nanoSP, nanoS, nanoFTS];

function OnboardingStepDeviceSelection() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const next = (deviceModelId: string) => {
    if (deviceModelId === "nanoFTS") {
      // TODO: fix navigation typescript by adding a type def RootStackParamList to the createStackNavigator
      // See: https://reactnavigation.org/docs/typescript/#type-checking-the-navigator
      // @ts-ignore next-line
      navigation.navigate(NavigatorName.SyncOnboarding, {
        screen: ScreenName.SyncOnboardingWelcome,
      });
    } else {
      // TODO: FIX @react-navigation/native using Typescript
      // @ts-ignore next-line
      navigation.navigate(ScreenName.OnboardingUseCase, {
        deviceModelId,
      });
    }
  };

  return (
    <OnboardingView
      hasBackButton
      title={t("onboarding.stepSelectDevice.title")}
    >
      <StyledStatusBar barStyle="dark-content" />
      {devices.map(device => (
        <ChoiceCard
          key={device.id}
          event="Onboarding Device - Selection"
          eventProperties={{ id: device.id }}
          testID={`Onboarding Device - Selection|${device.id}`}
          onPress={() => next(device.id)}
          subTitle={t(`onboarding.stepSelectDevice.${device.id}`)}
          subTitleProps={{ variant: "h2", color: "neutral.c100" }}
          title="Ledger"
          titleProps={{ variant: "small", color: "neutral.c70" }}
          Image={<device.SvgDevice fill={colors.neutral.c100} height={80} />}
        />
      ))}
      <TrackScreen category="Onboarding" name="SelectDevice" />
    </OnboardingView>
  );
}

export default OnboardingStepDeviceSelection;
