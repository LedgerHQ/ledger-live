import React, { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";
import Button from "../../../components/wrappedUi/Button";
import { TrackScreen, updateIdentify } from "../../../analytics";
import {
  setFirstConnectionHasDevice,
  setReadOnlyMode,
} from "../../../actions/settings";
import { AnalyticsContext } from "../../../analytics/AnalyticsContext";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";

const source = require("../../../../assets/images/devices/3DRenderVertical.png"); // eslint-disable-line @typescript-eslint/no-var-requires
const sourceStax = require("../../../../assets/images/devices/devices.png"); // eslint-disable-line @typescript-eslint/no-var-requires

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingDoYouHaveALedgerDevice
>;

function OnboardingStepDoYouHaveALedgerDevice({ navigation }: NavigationProps) {
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
      dispatch(setReadOnlyMode(true));
      setScreen && setScreen("Has Device?");

      return () => {
        setSource("Has Device?");
      };
    }, [dispatch, setScreen, setSource]),
  );

  const imageSource = useFeature("staxWelcomeScreen")?.enabled
    ? sourceStax
    : source;

  return (
    // @ts-expect-error Bindings are wrong…
    <SafeAreaView flex={1}>
      <TrackScreen category="Onboarding" name="Has Device?" />
      <Flex flex={1} bg="background.main">
        <StyledStatusBar barStyle="light-content" />
        <Box flex={1} justifyContent="center" alignItems="center" mt={8} mx={7}>
          <Image
            source={imageSource}
            resizeMode={"contain"}
            style={{ flex: 1, width: "100%" }}
          />
        </Box>
        <Flex px={6} pb={6}>
          <Text variant="h4" fontWeight="semiBold" pb={8}>
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
