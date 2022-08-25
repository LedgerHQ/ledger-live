import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import nanoS from "../assets/nanoS";
import nanoSP from "../assets/nanoSP";
import nanoX from "../assets/nanoX";
import { ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "../../../components/StyledStatusBar";
import ChoiceCard from "../../../components/ChoiceCard";

const devices = [nanoX, nanoSP, nanoS];

function OnboardingStepDeviceSelection() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const next = (deviceModelId: string) => {
    navigation.navigate(ScreenName.OnboardingUseCase, {
      deviceModelId,
    });
  };

  return (
    <OnboardingView
      hasBackButton
      title={t("onboarding.stepSelectDevice.title")}
    >
      <StyledStatusBar barStyle="dark-content" />
      {devices.map(Device => (
        <ChoiceCard
          key={Device.id}
          event="Onboarding Device - Selection"
          eventProperties={{ id: Device.id }}
          testID={`Onboarding Device - Selection|${Device.id}`}
          onPress={() => next(Device.id)}
          subTitle={t(`onboarding.stepSelectDevice.${Device.id}`)}
          subTitleProps={{ variant: "h2", color: "neutral.c100" }}
          title="Ledger"
          titleProps={{ variant: "small", color: "neutral.c70" }}
          Image={<Device fill={colors.neutral.c100} height={80} />}
        />
      ))}
      <TrackScreen category="Onboarding" name="SelectDevice" />
    </OnboardingView>
  );
}

export default OnboardingStepDeviceSelection;
