import React, { useCallback, useState } from "react";
import Video from "react-native-video";
import { Dimensions } from "react-native";
import Animated, { SlideInDown, SlideInLeft } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Flex, IconsLegacy, Text, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { TrackScreen, track } from "~/analytics";
import { useCompleteActionCallback } from "~/logic/postOnboarding/useCompleteAction";
import { NavigatorName, ScreenName } from "~/const";
import videoSources from "../../../assets/videos";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

const BulletItem = ({ textKey }: { textKey: string }) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="row" mb={6} alignItems="center">
      <IconsLegacy.CircledCheckSolidMedium color="primary.c80" />
      <Text ml={4}>{t(textKey)}</Text>
    </Flex>
  );
};

const videoDimensions = {
  height: Dimensions.get("window").width,
  width: Dimensions.get("window").width,
};

const ClaimNftWelcome = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isFirstVideo, setIsFirstVideo] = useState(true);
  const [firstVideoReadyForDisplay, setFirstVideoReadyForDisplay] = useState(false);

  const theme = useTheme();
  const completePostOnboardingAction = useCompleteActionCallback();

  const handleGoToQrScan = useCallback(() => {
    track("button_clicked", {
      button: "Claim Ledger Market Pass",
    });
    navigation.navigate(NavigatorName.ClaimNft, {
      screen: ScreenName.ClaimNftQrScan,
    });
  }, [navigation]);

  const handleSkipQrScan = useCallback(() => {
    track("button_clicked", {
      button: "I've already claimed my Ledger Market Pass",
    });
    completePostOnboardingAction(PostOnboardingActionId.claimNft);
    navigation.getParent()?.goBack();
  }, [completePostOnboardingAction, navigation]);

  const handleFirstVideoReadyForDisplay = useCallback(() => {
    setFirstVideoReadyForDisplay(true);
  }, []);

  const handleEndVideo = useCallback(() => {
    setIsFirstVideo(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category="Beginning of Claim Ledger Market Pass" />
      <Flex
        opacity={firstVideoReadyForDisplay ? 1 : 0}
        marginBottom={-0.4 * videoDimensions.height} // the bottom part of the video is empty space so other content can be displayed there
      >
        {/*
        Here we have two videos that are played back to back:
        The first video is an "introduction" part where the tickets slides into
        view, so it's played only once.
        Then the second video is an animation of that ticket that is getting
        repeated infinitely.
         */}
        <Video
          style={{
            ...videoDimensions,
          }}
          disableFocus
          paused={isFirstVideo}
          source={
            theme.dark ? videoSources.infinityPassPart02Dark : videoSources.infinityPassPart02Light
          }
          muted
          repeat
          resizeMode={"contain"}
        />
        {isFirstVideo ? (
          <Video
            style={{
              ...videoDimensions,
              position: "absolute",
            }}
            disableFocus
            source={
              theme.dark
                ? videoSources.infinityPassPart01Dark
                : videoSources.infinityPassPart01Light
            }
            onEnd={handleEndVideo}
            onReadyForDisplay={handleFirstVideoReadyForDisplay}
            muted
            resizeMode={"contain"}
          />
        ) : null}
      </Flex>
      {firstVideoReadyForDisplay ? (
        <AnimatedFlex flex={2} px={6} justifyContent="space-evenly">
          <AnimatedFlex entering={SlideInLeft.delay(1800)}>
            <Text variant="h4" fontWeight="semiBold" mt={7} mb={7} textAlign="center">
              {t("claimNft.welcomePage.title")}
            </Text>

            <Text color="neutral.c70" mb={6}>
              {t("claimNft.welcomePage.description.title")}
            </Text>
            <BulletItem textKey={"claimNft.welcomePage.description.1"} />
            <BulletItem textKey={"claimNft.welcomePage.description.2"} />
            <BulletItem textKey={"claimNft.welcomePage.description.3"} />
          </AnimatedFlex>
          <AnimatedFlex entering={SlideInDown.delay(1800)}>
            <Flex flexDirection="column" justifyContent="flex-end">
              <Button mb={8} type="main" onPress={handleGoToQrScan}>
                {t("claimNft.welcomePage.claimButton")}
              </Button>

              <Link onPress={handleSkipQrScan}>{t("claimNft.welcomePage.backButton")}</Link>
            </Flex>
          </AnimatedFlex>
        </AnimatedFlex>
      ) : null}
    </SafeAreaView>
  );
};

export default ClaimNftWelcome;
