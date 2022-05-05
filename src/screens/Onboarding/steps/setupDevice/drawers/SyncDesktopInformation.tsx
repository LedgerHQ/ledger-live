import React from "react";
import { useTranslation } from "react-i18next";
import {
  Flex,
  Button,
  Text,
  Icons,
  IconBox,
  ScrollContainer,
} from "@ledgerhq/native-ui";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

type WarningRouteProps = RouteProp<
  { params: { onNext?: () => void } },
  "params"
>;

const OnboardingSyncDesktopInformation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<WarningRouteProps>();

  const handlePress = () => {
    navigation.goBack();
    if (route.params.onNext) route.params.onNext();
  };

  return (
    <>
      <ScrollContainer flex={1}>
        <Flex alignItems="center">
          <IconBox
            Icon={Icons.DevicesAltMedium}
            color="neutral.c100"
            iconSize={24}
            boxSize={64}
          />
          <Text
            variant="h2"
            color="neutral.c100"
            mt={8}
            uppercase
            textAlign="center"
          >
            {t("onboarding.stepImportAccounts.warning.title")}
          </Text>
          <Text variant="body" color="neutral.c80" mt={6} textAlign="center">
            {t("onboarding.stepImportAccounts.warning.desc")}
          </Text>
        </Flex>
      </ScrollContainer>
      <Button type="main" mt={6} size="large" onPress={handlePress}>
        {t("onboarding.stepImportAccounts.warning.cta")}
      </Button>
    </>
  );
};

export default OnboardingSyncDesktopInformation;
