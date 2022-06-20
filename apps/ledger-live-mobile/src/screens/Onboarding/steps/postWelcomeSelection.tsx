import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { Text, Button, Flex } from "@ledgerhq/native-ui";
import { track, TrackScreen } from "../../../analytics";
import { NavigatorName, ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Illustration from "../../../images/illustration/Illustration";
import DiscoverCard from "../../Discover/DiscoverCard";

const setupLedgerImg = require("../../../images/illustration/Shared/_SetupLedger.png");
const buyNanoImg = require("../../../images/illustration/Shared/_BuyNanoX.png");
const discoverLiveImg = require("../../../images/illustration/Shared/_DiscoverLive.png");

type PostWelcomeDiscoverCardProps = {
  title: string;
  subTitle: string;
  event: string;
  testID: string;
  selectedOption: any;
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
        ...(selectedOption.title === title && {
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

function PostWelcomeSelection({
  route,
}: {
  route: RouteProp<{ params: { userHasDevice: boolean } }, "params">;
}) {
  const { userHasDevice } = route.params;

  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState({});

  const setupLedger = useCallback(() => {
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [navigation]);

  const buyLedger = useCallback(() => {
    track("Onboarding PostWelcome - Buy Ledger");
    navigation.navigate(NavigatorName.BuyDevice);
  }, [navigation]);

  const exploreLedger = useCallback(() => {
    track("Onboarding PostWelcome - Explore Live");
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
  }, [navigation]);

  return (
    <Flex flex={1} bg="background.main">
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
            onPress={setSelectedOption}
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
          onPress={setSelectedOption}
          onValidate={exploreLedger}
          imageSource={discoverLiveImg}
        />
        {!userHasDevice && (
          <PostWelcomeDiscoverCard
            title={t("onboarding.postWelcomeStep.buyNano.title")}
            subTitle={t("onboarding.postWelcomeStep.buyNano.subtitle")}
            event="Onboarding PostWelcome - Buy Nano"
            testID={`Onboarding PostWelcome - Selection|BuyNano`}
            selectedOption={selectedOption}
            onPress={setSelectedOption}
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
          onPress={selectedOption.onValidate}
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
