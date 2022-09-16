import React, { useCallback, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Text, Button, Flex } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { track, TrackScreen } from "../../../analytics";
import { NavigatorName, ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Illustration from "../../../images/illustration/Illustration";
import DiscoverCard from "../../Discover/DiscoverCard";
// eslint-disable-next-line import/no-cycle
import { AnalyticsContext } from "../../../components/RootNavigator";
import { setHasOrderedNano } from "../../../actions/settings";

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
  testID: string;
  selectedOption: any;
  // eslint-disable-next-line @typescript-eslint/ban-types
  onPress: Function;
  onValidate: () => void;
  imageSource: ImageSourcePropType;
};

const PostWelcomeDiscoverCard = ({
  title,
  subTitle,
  event,
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
      onValidate,
    });
  }, [onPress, onValidate, title, event]);

  return (
    <DiscoverCard
      title={title}
      titleProps={{ variant: "large" }}
      subTitle={subTitle}
      subTitleProps={{ variant: "paragraph" }}
      event={event}
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

type DataType = {
  title: string;
  event: string;
  onValidate: () => void;
};

function PostWelcomeSelection({
  route,
}: {
  route: RouteProp<{ params: { userHasDevice: boolean } }, "params">;
}) {
  const { userHasDevice } = route.params;
  const dispatch = useDispatch();

  const screenName = `Onboarding Choice ${
    userHasDevice ? "With Device" : "No Device"
  }`;

  const { source, setSource, setScreen } = useContext(AnalyticsContext);
  useFocusEffect(
    useCallback(() => {
      setScreen(screenName);

      return () => {
        setSource(screenName);
      };
    }, [setSource, setScreen, screenName]),
  );

  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<DataType | null>(null);

  const setupLedger = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [navigation]);

  const buyLedger = useCallback(() => {
    track("Onboarding PostWelcome - Buy Ledger");
    navigation.navigate(NavigatorName.BuyDevice);
  }, [navigation]);

  const exploreLedger = useCallback(() => {
    track("Onboarding PostWelcome - Explore Live");
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive, {
      source: screenName,
    });
  }, [navigation, screenName]);

  const syncCryptos = useCallback(() => {
    track("Onboarding PostWelcome - Sync Cryptos");
    navigation.navigate(ScreenName.OnboardingImportAccounts, {
      source: screenName,
    });
  });

  const onCardClick = useCallback(
    (data: DataType, value: string) => {
      setSelectedOption(data);
      track("banner_clicked", {
        banner: value,
        screen: screenName,
      });
    },
    [screenName],
  );

  const onContinue = useCallback(() => {
    selectedOption?.onValidate();
    track("button_clicked", {
      button: "Continue",
      screen: screenName,
    });
  }, [screenName, selectedOption]);

  const pressSetup = useCallback(
    (data: DataType) => onCardClick(data, "Setup my Ledger"),
    [onCardClick],
  );

  const pressExplore = useCallback(
    (data: DataType) => {
      dispatch(setHasOrderedNano(!!userHasDevice));

      onCardClick(data, "Explore LL");
    },
    [dispatch, onCardClick, userHasDevice],
  );

  const pressBuy = useCallback(
    (data: DataType) => onCardClick(data, "Buy a Nano X"),
    [onCardClick],
  );

  const pressSync = useCallback(
    (data: DataType) => onCardClick(data, "Sync Cryptos"),
    [onCardClick],
  );

  return (
    <Flex flex={1} bg="background.main">
      <TrackScreen
        category="Onboarding"
        name={userHasDevice ? "Choice With Device" : "Choice No Device"}
        source={source}
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
            event="Onboarding PostWelcome - Setup Ledger"
            testID={`Onboarding PostWelcome - Selection|SetupLedger`}
            selectedOption={selectedOption}
            onPress={pressSetup}
            onValidate={setupLedger}
            imageSource={setupLedgerImg}
          />
        )}
        <PostWelcomeDiscoverCard
          title={t("onboarding.postWelcomeStep.discoverLedger.title")}
          subTitle={t("onboarding.postWelcomeStep.discoverLedger.subtitle")}
          event="Onboarding PostWelcome - Explore Ledger"
          testID={`Onboarding PostWelcome - Selection|ExploreLedger`}
          selectedOption={selectedOption}
          onPress={pressExplore}
          onValidate={exploreLedger}
          imageSource={discoverLiveImg}
        />
        {userHasDevice && (
          <PostWelcomeDiscoverCard
            title={t("onboarding.postWelcomeStep.desktopSync.title")}
            subTitle={t("onboarding.postWelcomeStep.desktopSync.subtitle")}
            event="Onboarding PostWelcome - Sync Cryptos"
            testID={`Onboarding PostWelcome - Selection|SyncCryptos`}
            selectedOption={selectedOption}
            onPress={pressSync}
            onValidate={syncCryptos}
            imageSource={syncCryptoImg}
          />
        )}
        {!userHasDevice && (
          <PostWelcomeDiscoverCard
            title={t("onboarding.postWelcomeStep.buyNano.title")}
            subTitle={t("onboarding.postWelcomeStep.buyNano.subtitle")}
            event="Onboarding PostWelcome - Buy Nano"
            testID={`Onboarding PostWelcome - Selection|BuyNano`}
            selectedOption={selectedOption}
            onPress={pressBuy}
            onValidate={buyLedger}
            imageSource={buyNanoImg}
          />
        )}
        <TrackScreen category="Onboarding" name="SelectDevice" />
      </OnboardingView>
      {selectedOption && selectedOption.onValidate ? (
        <Button
          type="main"
          outline={false}
          event={selectedOption.event}
          onPress={onContinue}
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
