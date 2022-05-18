import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { Image } from "react-native";
import { ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Button from "../../../components/wrappedUi/Button";

const RenderVertical = require("../../../../assets/images/devices/3DRenderVertical.png");

function OnboardingStepDoYouHaveALedgerDevice({ navigation }: any) {
  const { t } = useTranslation();

  const nextHaveALedger = useCallback(() => {
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate({
      name: ScreenName.OnboardingPostWelcomeSelection,
      params: {
        userHasDevice: true,
      },
    });
  }, [navigation]);

  const nextDontHaveALedger = useCallback(() => {
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate({
      name: ScreenName.OnboardingPostWelcomeSelection,
      params: {
        userHasDevice: false,
      },
    });
  }, [navigation]);

  return (
    <Flex flex={1}>
      <StyledStatusBar barStyle="light-content" />
      <Box flex={1} justifyContent="center" alignItems="center" mt={8} mx={7}>
        <Image
          source={RenderVertical}
          resizeMode={"contain"}
          style={{ flex: 1, width: "100%" }}
        />
      </Box>
      <Flex px={6} pb={6}>
        <Text variant="large" fontWeight="medium" color="neutral.c70" pb={2}>
          {t("onboarding.stepDoYouHaveALedgerDevice.subtitle")}
        </Text>
        <Text variant="h4" color="neutral.c100" pb={8}>
          {t("onboarding.stepDoYouHaveALedgerDevice.title")}
        </Text>
        <Button
          type="main"
          size="large"
          event="Onboarding - Start"
          onPress={nextHaveALedger}
          mb={6}
        >
          {t("common.yes")}
        </Button>
        <Button
          type="main"
          size="large"
          event="Onboarding - Start"
          onPress={nextDontHaveALedger}
        >
          {t("common.no")}
        </Button>
      </Flex>
    </Flex>
  );
}

export default OnboardingStepDoYouHaveALedgerDevice;
