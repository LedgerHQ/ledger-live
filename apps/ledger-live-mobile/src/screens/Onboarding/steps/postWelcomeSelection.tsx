import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { ImageSourcePropType } from "react-native";
import { TrackScreen } from "../../../analytics";
import { NavigatorName, ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Illustration from "../../../images/illustration/Illustration";
import DiscoverCard from "../../Discover/DiscoverCard";
import { setHasOrderedNano } from "../../../actions/settings";
import Button from "../../../components/wrappedUi/Button";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupLedgerImg = require("../../../images/illustration/Shared/_SetupLedger.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const buyNanoImg = require("../../../images/illustration/Shared/_BuyNanoX.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const discoverLiveImg = require("../../../images/illustration/Shared/_DiscoverLive.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const syncCryptoImg = require("../../../images/illustration/Shared/_SyncFromDesktop.png");

const images = {
  light: {
    setupLedgerImg: require("../../../images/illustration/Light/Device/XFolded.png"),
    buyNanoImg: require("../../../images/illustration/Shared/_BuyNanoX.png"),
    discoverLiveImg: require("../../../images/illustration/Light/_050.png"),
    syncCryptoImg: require("../../../images/illustration/Light/_074.png"),
  },
  dark: {
    setupLedgerImg: require("../../../images/illustration/Dark/Device/XFolded.png"),
    buyNanoImg: require("../../../images/illustration/Shared/_BuyNanoX.png"),
    discoverLiveImg: require("../../../images/illustration/Dark/_050.png"),
    syncCryptoImg: require("../../../images/illustration/Dark/_074.png"),
  },
};

type PostWelcomeDiscoverCardProps = {
  title: string;
  subTitle: string;
  event: string;
  eventProperties?: Record<string, any>;
  testID: string;
  selectedOption: any;
  // eslint-disable-next-line @typescript-eslint/ban-types
  onPress: Function;
  onValidate: () => void;
  imageSource: {
    light: ImageSourcePropType;
    dark: ImageSourcePropType;
  };
};

const PostWelcomeDiscoverCard = ({
  title,
  subTitle,
  event,
  eventProperties,
  testID,
  selectedOption,
  onPress,
  onValidate,
  imageSource,
}: PostWelcomeDiscoverCardProps) => {
  const { colors } = useTheme();
  const setSelectedOption = useCallback(() => {
    onPress({
      title,
      event,
      banner: eventProperties?.banner,
      onValidate,
    });
  }, [onPress, title, event, eventProperties?.banner, onValidate]);

  return (
    <DiscoverCard
      title={title}
      titleProps={{ variant: "large" }}
      subTitle={subTitle}
      subTitleProps={{ variant: "paragraph" }}
      event={event}
      eventProperties={eventProperties}
      testID={testID}
      onPress={setSelectedOption}
      cardProps={{
        mx: 0,
        borderWidth: 1,
        borderColor: "transparent",
        ...(selectedOption?.title === title && {
          borderColor: colors.primary.c80,
          backgroundColor: colors.primary.c10,
        }),
      }}
      imageContainerProps={{
        position: "relative",
        height: "auto",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        paddingRight: 4,
      }}
      Image={
        <Illustration
          size={105}
          darkSource={imageSource.dark}
          lightSource={imageSource.light}
        />
      }
    />
  );
};

type DataType = {
  title: string;
  event: string;
  banne?: string;
  onValidate: () => void;
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
  const [selectedOption, setSelectedOption] = useState<DataType | null>(null);

  const setupLedger = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [navigation]);

  const buyLedger = useCallback(() => {
    navigation.navigate(NavigatorName.BuyDevice);
  }, [navigation]);

  const exploreLedger = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
  }, [navigation]);

  const syncCryptos = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingImportAccounts);
  }, [navigation]);

  const pressExplore = useCallback(
    (data: DataType) => {
      dispatch(setHasOrderedNano(!!userHasDevice));

      setSelectedOption(data);
    },
    [dispatch, setSelectedOption, userHasDevice],
  );

  const getSourceImageObj = key => ({
    light: images.light[key],
    dark: images.dark[key],
  });

  return (
    <Flex flex={1} bg="background.main">
      <TrackScreen
        category="Onboarding"
        name={userHasDevice ? "Choice With Device" : "Choice No Device"}
      />
      <OnboardingView hasBackButton>
        <Text variant="h4" fontWeight="semiBold" mb={2}>
          {t("onboarding.postWelcomeStep.title")}
        </Text>
        <Text variant="large" fontWeight="medium" color="neutral.c70" mb={9}>
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
            selectedOption={selectedOption}
            onPress={setSelectedOption}
            onValidate={setupLedger}
            imageSource={getSourceImageObj("setupLedgerImg")}
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
          selectedOption={selectedOption}
          onPress={pressExplore}
          onValidate={exploreLedger}
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
            selectedOption={selectedOption}
            onPress={setSelectedOption}
            onValidate={syncCryptos}
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
            selectedOption={selectedOption}
            onPress={setSelectedOption}
            onValidate={buyLedger}
            imageSource={getSourceImageObj("buyNanoImg")}
          />
        )}
        <TrackScreen category="Onboarding" name="SelectDevice" />
      </OnboardingView>
      {selectedOption && selectedOption.onValidate ? (
        <Button
          type="main"
          outline={false}
          event="button_clicked"
          eventProperties={{
            button: "Continue",
            banner: selectedOption?.banner,
          }}
          onPress={selectedOption?.onValidate}
          size="large"
          m={6}
          mb={8}
        >
          {t("postBuyDeviceSetupNanoWall.continue")}
        </Button>
      ) : null}
    </Flex>
  );
}

export default PostWelcomeSelection;
