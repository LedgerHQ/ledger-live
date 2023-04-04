import React, { useCallback, useState } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import Video from "react-native-video";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";
import { useTheme } from "@react-navigation/native";

import CustomImageBottomModal from "../../components/CustomImage/CustomImageBottomModal";
import BottomButtonsContainer from "../../components/CustomImage/BottomButtonsContainer";
import Button from "../../components/wrappedUi/Button";
import { ScreenName } from "../../const";
import { CustomImageNavigatorParamList } from "../../components/RootNavigator/types/CustomImageNavigator";
import { TrackScreen } from "../../analytics";
import videoSources from "../../../assets/videos";

const videoDimensions = {
  height: 550,
  width: 1080,
};

const analyticsScreenName = "Introduction of the customization flow";
const analyticsButtonEventProps = {
  button: "Choose a picture",
};

const Step0Welcome: React.FC<
  StackScreenProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImageStep0Welcome
  >
> = ({ route }) => {
  const theme = useTheme();
  const [modalOpened, setModalOpened] = useState(false);
  const { t } = useTranslation();

  const { params } = route;

  const { device } = params || {};

  const openModal = useCallback(() => {
    setModalOpened(true);
  }, [setModalOpened]);

  const closeModal = useCallback(() => {
    setModalOpened(false);
  }, [setModalOpened]);

  const { width: screenWidth } = useWindowDimensions();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category={analyticsScreenName} />
      <Flex flex={1} mt={8}>
        <Video
          disableFocus
          source={
            theme.dark
              ? videoSources.customLockScreenBannerDark
              : videoSources.customLockScreenBannerLight
          }
          style={{
            width: screenWidth,
            height:
              (videoDimensions.height / videoDimensions.width) * screenWidth,
          }}
          muted
          repeat
          resizeMode={"contain"}
        />
        <Flex px={7}>
          <Text
            variant="h4"
            fontWeight="semiBold"
            mt={8}
            textAlign="center"
            testID="custom-image-welcome-title"
          >
            {t("customImage.landingPage.title")}
          </Text>
        </Flex>
        <BottomButtonsContainer>
          <Button
            alignSelf="stretch"
            size="large"
            type="main"
            outline={false}
            onPress={openModal}
            event="button_clicked"
            eventProperties={analyticsButtonEventProps}
            testID="custom-image-choose-picture-button"
          >
            {t("customImage.landingPage.choosePicture")}
          </Button>
        </BottomButtonsContainer>
      </Flex>
      <CustomImageBottomModal
        device={device}
        isOpened={modalOpened}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
};

export default Step0Welcome;
