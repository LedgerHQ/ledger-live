import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { track, TrackScreen } from "../../../analytics";
import ChoiceCard from "../../../components/ChoiceCard";
import { NavigatorName, ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Illustration from "../../../images/illustration/Illustration";
import DiscoverCard from "../../Discover/DiscoverCard";

const setupLedgerImg = require("../../../images/illustration/Shared/_SetupLedger.png");

const buyNanoImg = require("../../../images/illustration/Shared/_BuyNanoX.png");

function PostWelcomeSelection() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const setupLedger = useCallback(() => {
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
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
      <DiscoverCard
        title={t("onboarding.postWelcomeStep.setupLedger.title")}
        titleProps={{ variant: "h3" }}
        subTitle={t("onboarding.postWelcomeStep.setupLedger.subtitle")}
        event="Onboarding PostWelcome - Setup Ledger"
        testID={`Onboarding PostWelcome - Selection|SetupLedger`}
        onPress={setupLedger}
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
        title={t("onboarding.postWelcomeStep.buyNano.title")}
        titleProps={{ variant: "h3" }}
        subTitle={t("onboarding.postWelcomeStep.buyNano.subtitle")}
        event="Onboarding PostWelcome - Buy Nano"
        testID={`Onboarding PostWelcome - Selection|BuyNano`}
        onPress={buyLedger}
        cardProps={{ mx: 0 }}
        Image={
          <Illustration
            size={130}
            darkSource={buyNanoImg}
            lightSource={buyNanoImg}
          />
        }
      />
      <TrackScreen category="Onboarding" name="SelectDevice" />
    </OnboardingView>
  );
}

export default PostWelcomeSelection;
