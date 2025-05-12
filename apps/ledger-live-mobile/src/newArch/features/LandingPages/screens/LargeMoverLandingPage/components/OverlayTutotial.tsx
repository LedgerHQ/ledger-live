import React from "react";
import { Flex, Text, Button, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { PromisableButton } from "@ledgerhq/native-ui/lib/components/cta/Button/index";
import { BlurView } from "@react-native-community/blur";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

export const OverlayTutorial = ({ handleCloseOverlay }: { handleCloseOverlay: () => void }) => {
  const { t } = useTranslation();
  const { dark } = useTheme();

  return (
    <Flex flex={1} position="absolute" top={0} bottom={0} left={0} right={0} zIndex={10}>
      <BlurView style={StyleSheet.absoluteFill} blurAmount={2} blurType={dark ? "dark" : "light"} />

      <Flex flex={1} justifyContent="space-between" alignItems="center" padding={6}>
        <Flex position="absolute" top={70} right={4}>
          <Button onPress={() => handleCloseOverlay()}>
            <Icons.Close size="M" color="neutral.c100" />
          </Button>
        </Flex>

        <Flex flex={1} justifyContent="center" alignItems="center">
          <Flex paddingBottom={4}>
            <Icons.Swipe size="XXL" />
          </Flex>
          <Text fontSize={20} fontWeight="bold">
            {t("largeMover.overlay.title")}
          </Text>
          <Text color="neutral.c70" paddingTop={6}>
            {t("largeMover.overlay.action")}
          </Text>
        </Flex>

        <Flex width="95%" paddingBottom={6}>
          <PromisableButton
            onPress={() => {
              handleCloseOverlay();
            }}
          >
            {t("largeMover.overlay.button")}
          </PromisableButton>
        </Flex>
      </Flex>
    </Flex>
  );
};
