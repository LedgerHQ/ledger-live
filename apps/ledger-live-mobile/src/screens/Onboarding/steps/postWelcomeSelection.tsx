import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, ScrollListContainer } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { ImageSourcePropType } from "react-native";

import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { TrackScreen } from "../../../analytics";
import { NavigatorName, ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Illustration, {
  Props as IllustrationProps,
} from "../../../images/illustration/Illustration";
import { setHasOrderedNano, setReadOnlyMode } from "../../../actions/settings";
import DeviceSetupView from "../../../components/DeviceSetupView";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import Touchable from "../../../components/Touchable";
import ChoiceCard, { Props as ChoiceCardProps } from "./ChoiceCard";

const images = {
  light: {
    setupLedgerImg: require("../../../images/illustration/Light/Device/XFolded.png"),
    setupLedgerStaxImg: require("../../../images/illustration/Light/Device/Stax.png"),
    buyNanoImg: require("../../../images/illustration/Shared/_BuyNanoX.png"),
    discoverLiveImg: require("../../../images/illustration/Light/_050.png"),
    syncCryptoImg: require("../../../images/illustration/Light/_074.png"),
  },
  dark: {
    setupLedgerImg: require("../../../images/illustration/Dark/Device/XFolded.png"),
    setupLedgerStaxImg: require("../../../images/illustration/Dark/Device/Stax.png"),
    buyNanoImg: require("../../../images/illustration/Shared/_BuyNanoX.png"),
    discoverLiveImg: require("../../../images/illustration/Dark/_050.png"),
    syncCryptoImg: require("../../../images/illustration/Dark/_074.png"),
  },
};

type PostWelcomeChoiceCardProps = {
  title: string;
  subTitle: string;
  event: string;
  eventProperties?: Record<string, unknown>;
  testID: string;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
  onValidate?: () => void;
  imageSource: {
    light: ImageSourcePropType;
    dark: ImageSourcePropType;
  };
  imageContainerProps?: ChoiceCardProps["imageContainerProps"];
  imageProps?: Partial<IllustrationProps>;
};

const PostWelcomeDiscoverCard = ({
  title,
  subTitle,
  event,
  eventProperties,
  testID,
  onPress,
  imageSource,
  imageContainerProps,
  imageProps,
}: PostWelcomeChoiceCardProps) => {
  return (
    <ChoiceCard
      title={title}
      titleProps={{ variant: "large", fontWeight: "semiBold" }}
      subtitleElement={
        <Text variant="paragraph" color="neutral.c70">
          {subTitle}
        </Text>
      }
      event={event}
      testID={testID}
      onPress={onPress}
      eventProperties={eventProperties}
      imageContainerProps={
        imageContainerProps ?? {
          position: "relative",
          height: "auto",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          paddingRight: 4,
        }
      }
      Image={
        <Illustration
          size={105}
          darkSource={imageSource.dark}
          lightSource={imageSource.light}
          {...imageProps}
        />
      }
    />
  );
};

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingPostWelcomeSelection
>;

function PostWelcomeSelection({ route }: NavigationProps) {
  const { userHasDevice } = route.params;
  const dispatch = useDispatch();

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { t } = useTranslation();

  const setupLedger = useCallback(() => {
    dispatch(setReadOnlyMode(false));
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [navigation]);

  const buyLedger = useCallback(() => {
    (
      navigation as unknown as StackNavigatorNavigation<BaseNavigatorStackParamList>
    ).navigate(NavigatorName.BuyDevice);
  }, [navigation]);

  const exploreLedger = useCallback(() => {
    dispatch(setHasOrderedNano(!!userHasDevice));
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
  }, [navigation, dispatch, userHasDevice]);

  const syncCryptos = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingImportAccounts);
  }, [navigation]);

  const getSourceImageObj = (key: keyof typeof images.light) => ({
    light: images.light[key],
    dark: images.dark[key],
  });

  const staxWelcomeScreenEnabled = useFeature("staxWelcomeScreen")?.enabled;
  const setupLedgerImageSource = useMemo(
    () =>
      staxWelcomeScreenEnabled
        ? getSourceImageObj("setupLedgerStaxImg")
        : getSourceImageObj("setupLedgerImg"),
    [staxWelcomeScreenEnabled],
  );

  const handleBack = useCallback(() => {
    dispatch(setReadOnlyMode(true));
    navigation.goBack();
  }, []);

  return (
    <DeviceSetupView hasBackButton onBack={handleBack}>
      <ScrollListContainer flex={1} mx={6}>
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
            imageSource={setupLedgerImageSource}
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
          imageSource={getSourceImageObj("discoverLiveImg")}
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
            imageSource={getSourceImageObj("syncCryptoImg")}
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
            imageSource={getSourceImageObj("buyNanoImg")}
            imageContainerProps={{}}
            imageProps={{
              width: 140,
              height: "90%",
              resizeMode: "contain",
            }}
          />
        )}
      </ScrollListContainer>
    </DeviceSetupView>
  );
}

export default PostWelcomeSelection;
