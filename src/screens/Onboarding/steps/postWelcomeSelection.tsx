import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Link as TextLink } from "@ledgerhq/native-ui";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { track, TrackScreen } from "../../../analytics";
import ChoiceCard from "../../../components/ChoiceCard";
import { NavigatorName, ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Illustration from "../../../images/illustration/Illustration";

const setupLedgerImg = {
  dark: require("../../../images/illustration/Dark/_079.png"),
  light: require("../../../images/illustration/Light/_079.png"),
};

const discoverLedgerImg = {
  dark: require("../../../images/illustration/Dark/_075.png"),
  light: require("../../../images/illustration/Light/_075.png"),
};

function PostWelcomeSelection() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const onboardingWithoutNano = useFeature("onboardingWithoutNano");

  const setupLedger = useCallback(() => {
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [navigation]);

  const discoverLedger = useCallback(() => {
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
  }, [navigation]);

  const buyLedger = useCallback(() => {
    track("Onboarding PostWelcome - Buy Ledger");
    navigation.navigate(NavigatorName.BuyDevice);
  }, []);

  return (
    <OnboardingView
      hasBackButton
      title={t("onboarding.postWelcomeStep.title")}
      subTitle={t("onboarding.postWelcomeStep.subtitle")}
    >
      <StyledStatusBar barStyle="dark-content" />
      <ChoiceCard
        title={t("onboarding.postWelcomeStep.setupLedger.title")}
        subTitle={t("onboarding.postWelcomeStep.setupLedger.subtitle")}
        labelBadge={t("onboarding.postWelcomeStep.setupLedger.label")}
        event="Onboarding PostWelcome - Setup Ledger"
        testID={`Onboarding PostWelcome - Selection|SetupLedger`}
        onPress={setupLedger}
        Image={
          <Illustration
            size={80}
            darkSource={setupLedgerImg.dark}
            lightSource={setupLedgerImg.light}
          />
        }
      />
      <ChoiceCard
        disabled={!onboardingWithoutNano?.enabled}
        title={t("onboarding.postWelcomeStep.discoverLedger.title")}
        subTitle={t("onboarding.postWelcomeStep.discoverLedger.subtitle")}
        labelBadge={t("platform.catalog.branch.soon")}
        event="Onboarding PostWelcome - Discover Ledger"
        testID={`Onboarding PostWelcome - Selection|DiscoverLedger`}
        onPress={discoverLedger}
        Image={
          <Illustration
            size={100}
            darkSource={discoverLedgerImg.dark}
            lightSource={discoverLedgerImg.light}
          />
        }
      />
      <TextLink type="color" onPress={buyLedger}>
        {t("onboarding.postWelcomeStep.noLedgerLink")}
      </TextLink>
      <TrackScreen category="Onboarding" name="SelectDevice" />
    </OnboardingView>
  );
}

export default PostWelcomeSelection;
