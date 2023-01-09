import React, { useCallback, useState } from "react";
import Video from "react-native-video";

import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Flex, Icons, Text, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useCompleteActionCallback } from "../../logic/postOnboarding/useCompleteAction";
import { NavigatorName, ScreenName } from "../../const";

const infinityPassPart01 = require("../../../assets/videos/infinityPassDark/infinityPassPart01.mp4");
const infinityPassPart02 = require("../../../assets/videos/infinityPassDark/infinityPassPart02.mp4");

const test = require("../../../assets/videos/infinityPassDark/infinityPassCenter.mp4");

const absoluteStyle = {
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  top: 0,
  right: 0,
};

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
  const theme = useTheme();
  console.log(theme);
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

  const handleEndVideo = useCallback(() => {
    console.log("ok");
    setIsFirstVideo(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1}>
        <Flex flex={1}>
          {isFirstVideo ? (
            <Video
              style={absoluteStyle}
              disableFocus
              source={infinityPassPart01}
              muted
              repeat
              onEnd={handleEndVideo}
              resizeMode={"contain"}
            />
          ) : (
            <Video
              style={absoluteStyle}
              disableFocus
              source={infinityPassPart02}
              muted
              repeat
              onEnd={handleEndVideo}
              resizeMode={"contain"}
            />
          )}
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
      </Flex>
    </SafeAreaView>
  );
};

export default ClaimNftWelcome;
