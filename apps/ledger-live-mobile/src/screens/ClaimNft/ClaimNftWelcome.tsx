import React, { useCallback, useState } from "react";
import Video from "react-native-video";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Flex, Icons, Text, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useCompleteActionCallback } from "../../logic/postOnboarding/useCompleteAction";
import { NavigatorName, ScreenName } from "../../const";
import videoSources from "../../../assets/videos";

const BulletItem = ({ textKey }: { textKey: string }) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="row" mb={6} alignItems="center">
      <Icons.CircledCheckSolidRegular color="primary.c80" />
      <Text ml={4}>{t(textKey)}</Text>
    </Flex>
  );
};

const ClaimNftWelcome = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isFirstVideo, setIsFirstVideo] = useState(true);
  const [firstVideoReadyForDisplay, setFirstVideoReadyForDisplay] =
    useState(false);
  const [videoDimensions, setVideoDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const theme = useTheme();
  const completePostOnboardingAction = useCompleteActionCallback();

  const handleGoToQrScan = useCallback(
    () =>
      navigation.navigate(NavigatorName.ClaimNft, {
        screen: ScreenName.ClaimNftQrScan,
      }),
    [navigation],
  );

  const handleSkipQrScan = useCallback(() => {
    completePostOnboardingAction(PostOnboardingActionId.claimNft);
    navigation.getParent()?.goBack();
  }, [completePostOnboardingAction, navigation]);

  const handleFirstVideoLoaded = useCallback(payload => {
    const { naturalSize } = payload;
    const { height, width } = naturalSize;
    if (!width) return;
    const heightWidthRatio = (height ?? 0) / width;
    const windowWidth = Dimensions.get("window").width;
    setVideoDimensions({
      width: windowWidth,
      height: heightWidthRatio * windowWidth,
    });
  }, []);

  const handleFirstVideoReadyForDisplay = useCallback(() => {
    setFirstVideoReadyForDisplay(true);
  }, []);

  const handleEndVideo = useCallback(() => {
    setIsFirstVideo(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex
        opacity={firstVideoReadyForDisplay ? 1 : 0}
        marginBottom={
          videoDimensions?.height ? -0.4 * videoDimensions?.height : 0
        } // the bottom part of the video is empty space so other content can be displayed there
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
            theme.dark
              ? videoSources.infinityPassPart02Dark
              : videoSources.infinityPassPart02Light
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
            onLoad={handleFirstVideoLoaded}
            onReadyForDisplay={handleFirstVideoReadyForDisplay}
            muted
            resizeMode={"contain"}
          />
        ) : null}
      </Flex>
      <Flex flex={2} px={6} justifyContent="space-evenly">
        <Text variant="h4" fontWeight="semiBold" mt={7} textAlign="center">
          {t("claimNft.welcomePage.title")}
        </Text>
        <Flex>
          <Text color="neutral.c70" mb={6}>
            {t("claimNft.welcomePage.description.title")}
          </Text>
          <BulletItem textKey={"claimNft.welcomePage.description.1"} />
          <BulletItem textKey={"claimNft.welcomePage.description.2"} />
          <BulletItem textKey={"claimNft.welcomePage.description.3"} />
        </Flex>
        <Flex flexDirection="column" justifyContent="flex-end">
          <Button mb={8} type="main" onPress={handleGoToQrScan}>
            {t("claimNft.welcomePage.claimButton")}
          </Button>
          <Link onPress={handleSkipQrScan}>
            {t("claimNft.welcomePage.backButton")}
          </Link>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};

export default ClaimNftWelcome;
