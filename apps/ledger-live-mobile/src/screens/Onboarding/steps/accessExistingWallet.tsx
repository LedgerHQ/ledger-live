import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Text, ScrollListContainer, Box, Flex, Icons } from "@ledgerhq/native-ui";
import { props } from "lodash/fp";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import Touchable from "../../../components/Touchable";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const/navigation";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";

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
  OnboardingNavigatorParamList,
  ScreenName.OnboardingWelcomeBack
>;

const Card = ({ title, event, eventProperties, testID, onPress, Icon }: CardProps) => {
  const { colors, space } = useTheme();
  return (
    <Touchable onPress={onPress} {...props}>
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

        <Text variant="h5" fontWeight="medium" color="neutral.c100">
          {title}
        </Text>
      </Flex>
    </Touchable>
  );
};

function AccessExistingWallet() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const connect = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingBluetoothInformation);
  }, [navigation]);

  const sync = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingImportAccounts);
  }, [navigation]);

  const recover = useCallback(() => {
    console.log("recover");
  }, []);

  return (
    <ScrollListContainer flex={1} mx={6} mt={3}>
      <TrackScreen category="Onboarding" name="SelectDevice" />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100">
        {t("onboarding.welcomeBackStep.title")}
      </Text>

      <Text variant="paragraph" mb={7} mt={2} fontWeight="medium" color={colors.opacityDefault.c70}>
        {t("onboarding.welcomeBackStep.subtitle")}
      </Text>

      <Box mb={6}>
        <Card
          title={t("onboarding.welcomeBackStep.connect")}
          event={""}
          testID={""}
          onPress={connect}
          Icon={<Icons.BluetoothMedium color="primary.c80" size={30} />}
        />
      </Box>
      <Box mb={6}>
        <Card
          title={t("onboarding.welcomeBackStep.sync")}
          event={""}
          testID={""}
          onPress={sync}
          Icon={<Icons.QrCodeMedium color="primary.c80" size={30} />}
        />
      </Box>
      <Card
        title={t("onboarding.welcomeBackStep.recover")}
        event={""}
        testID={""}
        onPress={recover}
        Icon={<Icons.ShieldMedium color="primary.c80" size={30} />}
      />
    </ScrollListContainer>
  );
}

export default AccessExistingWallet;
