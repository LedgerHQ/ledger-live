import React, { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Button from "../../../components/wrappedUi/Button";
import { TrackScreen, updateIdentify } from "../../../analytics";
import { setFirstConnectionHasDevice } from "../../../actions/settings";
// eslint-disable-next-line import/no-cycle
import { AnalyticsContext } from "../../../components/RootNavigator";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const RenderVertical = require("../../../../assets/images/devices/3DRenderVertical.png");

function OnboardingStepDoYouHaveALedgerDevice({ navigation }: any) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const identifyUser = useCallback(
    (hasDevice: boolean) => {
      dispatch(setFirstConnectionHasDevice(hasDevice));
      updateIdentify();
    },
    [dispatch],
  );

  const nextHaveALedger = useCallback(() => {
    identifyUser(true);
    navigation.navigate({
      name: ScreenName.OnboardingPostWelcomeSelection,
      params: {
        userHasDevice: true,
      },
    });
  }, [identifyUser, navigation]);

  const nextDontHaveALedger = useCallback(() => {
    identifyUser(false);
    navigation.navigate({
      name: ScreenName.OnboardingPostWelcomeSelection,
      params: {
        userHasDevice: false,
      },
    });
  }, [identifyUser, navigation]);

  const { setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen("Has Device?");

      return () => {
        setSource("Has Device?");
      };
    }, [setSource, setScreen]),
  );

  return (
    <SafeAreaView flex={1}>
      <TrackScreen category="Onboarding" name="Has Device?" />
      <Flex flex={1} bg="background.main">
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
            event="button_clicked"
            eventProperties={{
              button: "Yes",
              screen: ScreenName.OnboardingDoYouHaveALedgerDevice,
            }}
            onPress={nextHaveALedger}
            mb={6}
          >
            {t("onboarding.stepDoYouHaveALedgerDevice.yes")}
          </Button>
          <Button
            type="main"
            size="large"
            event="button_clicked"
            eventProperties={{
              button: "No",
              screen: ScreenName.OnboardingDoYouHaveALedgerDevice,
            }}
            onPress={nextDontHaveALedger}
            mb={6}
          >
            {t("onboarding.stepDoYouHaveALedgerDevice.no")}
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}

export default OnboardingStepDoYouHaveALedgerDevice;
