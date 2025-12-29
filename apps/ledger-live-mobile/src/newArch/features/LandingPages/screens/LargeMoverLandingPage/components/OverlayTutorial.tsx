import React from "react";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { PromisableButton } from "@ledgerhq/native-ui/lib/components/cta/Button/index";
import { BlurView } from "@react-native-community/blur";
import { StyleSheet } from "react-native";
import { useDispatch } from "~/context/store";
import { track, TrackScreen } from "~/analytics";
import { PAGE_NAME } from "../const";
import { setTutorial } from "~/actions/largeMoverLandingPage";

export const OverlayTutorial = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const handleCloseOverlay = () => {
    dispatch(setTutorial(false));
    track("large_mover_tutorial", {
      page: PAGE_NAME,
      button: "Close tutorial",
    });
  };
  return (
    <Flex
      flex={1}
      position="absolute"
      top={0}
      bottom={0}
      left={0}
      right={0}
      zIndex={10}
      testID="overlay-tutorial"
    >
      <TrackScreen name="Large_Mover_Tutorial" />
      <BlurView style={StyleSheet.absoluteFill} blurAmount={2} blurType="dark" />

      <Flex flex={1} justifyContent="space-between" alignItems="center" padding={6}>
        <Flex flex={1} justifyContent="center" alignItems="center">
          <Flex paddingBottom={4}>
            <Icons.Swipe size="XXL" color="constant.white" />
          </Flex>
          <Text fontSize={20} fontWeight="bold" color="constant.white">
            {t("largeMover.overlay.title")}
          </Text>
          <Text color="constant.white" paddingTop={6}>
            {t("largeMover.overlay.action")}
          </Text>
        </Flex>
        <Flex width="95%" paddingBottom={6}>
          <PromisableButton
            onPress={handleCloseOverlay}
            testID="close-overlay-button"
            accessibilityRole="button"
          >
            {t("largeMover.overlay.button")}
          </PromisableButton>
        </Flex>
      </Flex>
    </Flex>
  );
};
