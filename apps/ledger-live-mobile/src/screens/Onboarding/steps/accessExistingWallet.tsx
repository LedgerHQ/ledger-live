import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Text, ScrollListContainer, Box, Flex, Icons } from "@ledgerhq/native-ui";
import { props } from "lodash/fp";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import Touchable from "../../../components/Touchable";
import { TrackScreen, track } from "../../../analytics";
import { ScreenName } from "../../../const/navigation";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { setOnboardingType } from "../../../actions/settings";
import { OnboardingType } from "../../../reducers/types";

type CardProps = {
  title: string;
  event: string;
  eventProperties?: Record<string, unknown>;
  testID: string;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
  style?: React.CSSProperties;
  Icon?: React.ReactElement;
};

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList & BaseNavigatorStackParamList,
  ScreenName.OnboardingWelcomeBack
>;

const Card = ({ title, event, eventProperties, testID, onPress, Icon }: CardProps) => {
  const { colors, space } = useTheme();

  const pressAndTrack = useCallback(() => {
    track(event, {
      ...eventProperties,
    });
    onPress?.();
  }, [event, eventProperties, onPress]);

  return (
    <Touchable onPress={pressAndTrack} {...props} testID={testID}>
      <Flex
        flexDirection="row"
        px={7}
        alignItems="center"
        bg={colors.opacityDefault.c05}
        padding={space[7]}
        borderRadius={space[4]}
      >
        <Box mr={4} pt={1}>
          {Icon}
        </Box>
        <Box pr={space[7]}>
          <Text variant="h5" fontWeight="medium" color="neutral.c100" flexWrap="wrap">
            {title}
          </Text>
        </Box>
      </Flex>
    </Touchable>
  );
};

function AccessExistingWallet() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const connect = useCallback(() => {
    dispatch(setOnboardingType(OnboardingType.connect));

    navigation.navigate(ScreenName.OnboardingPairNew, {
      deviceModelId: undefined,
      showSeedWarning: false,
    });
  }, [dispatch, navigation]);

  const sync = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingImportAccounts);
  }, [navigation]);

  return (
    <ScrollListContainer flex={1} mx={6} mt={3}>
      <TrackScreen category="Onboarding" name="Choose Access to Wallet" />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100">
        {t("onboarding.welcomeBackStep.title")}
      </Text>

      <Text variant="paragraph" mb={7} mt={2} fontWeight="medium" color={colors.opacityDefault.c70}>
        {t("onboarding.welcomeBackStep.subtitle")}
      </Text>

      <Box mb={6}>
        <Card
          title={t("onboarding.welcomeBackStep.connect")}
          event={"button_clicked"}
          eventProperties={{
            button: "Connect your Ledger",
          }}
          testID={"Existing Wallet | Connect"}
          onPress={connect}
          Icon={<Icons.BluetoothMedium color="primary.c80" size={30} />}
        />
      </Box>
      <Box mb={6}>
        <Card
          title={t("onboarding.welcomeBackStep.sync")}
          event={"button_clicked"}
          eventProperties={{
            button: "Sync with Desktop",
          }}
          testID={"Existing Wallet | Sync"}
          onPress={sync}
          Icon={<Icons.QrCodeMedium color="primary.c80" size={30} />}
        />
      </Box>
    </ScrollListContainer>
  );
}

export default AccessExistingWallet;
