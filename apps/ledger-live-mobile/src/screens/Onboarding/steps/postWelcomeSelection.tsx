import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { Text, ScrollListContainer } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { ImageSourcePropType } from "react-native";

import { TrackScreen } from "../../../analytics";
import { NavigatorName, ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Illustration from "../../../images/illustration/Illustration";
import DiscoverCard from "../../Discover/DiscoverCard";
import { setHasOrderedNano } from "../../../actions/settings";
import DeviceSetupView from "../../../components/DeviceSetupView";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupLedgerImg = require("../../../images/illustration/Shared/_SetupLedger.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const buyNanoImg = require("../../../images/illustration/Shared/_BuyNanoX.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const discoverLiveImg = require("../../../images/illustration/Shared/_DiscoverLive.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const syncCryptoImg = require("../../../images/illustration/Shared/_SyncFromDesktop.png");

type PostWelcomeDiscoverCardProps = {
  title: string;
  subTitle: string;
  event: string;
  eventProperties?: Record<string, any>;
  testID: string;
  onPress: () => void;
  imageSource: ImageSourcePropType;
};

const PostWelcomeDiscoverCard = ({
  title,
  subTitle,
  event,
  eventProperties,
  testID,
  onPress,
  imageSource,
}: PostWelcomeDiscoverCardProps) => {
  return (
    <DiscoverCard
      title={title}
      titleProps={{ variant: "large" }}
      subTitle={subTitle}
      subTitleProps={{ variant: "paragraph" }}
      event={event}
      eventProperties={eventProperties}
      testID={testID}
      onPress={onPress}
      cardProps={{
        mx: 0,
        mb: 6,
        borderWidth: 1,
        borderColor: "transparent",
      }}
      Image={
        <Illustration
          size={130}
          darkSource={imageSource}
          lightSource={imageSource}
        />
      }
    />
  );
};

function PostWelcomeSelection({
  route,
}: {
  route: RouteProp<{ params: { userHasDevice: boolean } }, "params">;
}) {
  const { userHasDevice } = route.params;
  const dispatch = useDispatch();

  const navigation = useNavigation();
  const { t } = useTranslation();

  const setupLedger = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [navigation]);

  const buyLedger = useCallback(() => {
    navigation.navigate(NavigatorName.BuyDevice);
  }, [navigation]);

  const exploreLedger = useCallback(() => {
    dispatch(setHasOrderedNano(!!userHasDevice));
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
  }, [navigation, dispatch, userHasDevice]);

  const syncCryptos = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingImportAccounts);
  }, [navigation]);

  return (
    <DeviceSetupView hasBackButton>
      <ScrollListContainer flex={1} px={6}>
        <TrackScreen
          category="Onboarding"
          name={userHasDevice ? "Choice With Device" : "Choice No Device"}
        />
        <TrackScreen category="Onboarding" name="SelectDevice" />
        <Text variant="h4" fontWeight="semiBold" mb={3}>
          {t("onboarding.postWelcomeStep.title")}
        </Text>
        <Text variant="large" color="neutral.c70" mb={8}>
          {t(
            userHasDevice
              ? "onboarding.postWelcomeStep.subtitle_yes"
              : "onboarding.postWelcomeStep.subtitle_no",
          )}
        </Text>
        <StyledStatusBar barStyle="dark-content" />
        {userHasDevice && (
          <PostWelcomeDiscoverCard
            title={t("onboarding.postWelcomeStep.setupLedger.title")}
            subTitle={t("onboarding.postWelcomeStep.setupLedger.subtitle")}
            event="banner_clicked"
            eventProperties={{
              banner: "Setup my Ledger",
            }}
            testID={`Onboarding PostWelcome - Selection|SetupLedger`}
            onPress={setupLedger}
            imageSource={setupLedgerImg}
          />
        )}
        <PostWelcomeDiscoverCard
          title={t("onboarding.postWelcomeStep.discoverLedger.title")}
          subTitle={t("onboarding.postWelcomeStep.discoverLedger.subtitle")}
          event="banner_clicked"
          eventProperties={{
            banner: "Explore LL",
          }}
          testID={`Onboarding PostWelcome - Selection|ExploreLedger`}
          onPress={exploreLedger}
          imageSource={discoverLiveImg}
        />
        {userHasDevice && (
          <PostWelcomeDiscoverCard
            title={t("onboarding.postWelcomeStep.desktopSync.title")}
            subTitle={t("onboarding.postWelcomeStep.desktopSync.subtitle")}
            event="banner_clicked"
            eventProperties={{
              banner: "Sync Cryptos",
            }}
            testID={`Onboarding PostWelcome - Selection|SyncCryptos`}
            onPress={syncCryptos}
            imageSource={syncCryptoImg}
          />
        )}
        {!userHasDevice && (
          <PostWelcomeDiscoverCard
            title={t("onboarding.postWelcomeStep.buyNano.title")}
            subTitle={t("onboarding.postWelcomeStep.buyNano.subtitle")}
            event="banner_clicked"
            eventProperties={{
              banner: "Buy a Nano X",
            }}
            testID={`Onboarding PostWelcome - Selection|BuyNano`}
            onPress={buyLedger}
            imageSource={buyNanoImg}
          />
        )}
      </ScrollListContainer>
    </DeviceSetupView>
  );
}

export default PostWelcomeSelection;
