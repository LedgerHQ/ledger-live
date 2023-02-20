import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Linking, Platform } from "react-native";
import {
  Flex,
  Button,
  Text,
  IconBoxList,
  Icons,
  Link as TextLink,
  ScrollListContainer,
} from "@ledgerhq/native-ui";
import { urls } from "../../../../../config/urls";

const bullets = [
  "onboarding.stepPairNew.infoModal.bullets.0.label",
  "onboarding.stepPairNew.infoModal.bullets.1.label",
  "onboarding.stepPairNew.infoModal.bullets.2.label",
];

const BluetoothConnection = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handlePress = React.useCallback(() => {
    // Opening the link with some app, if the URL scheme is "http" the web link should be opened
    // by some browser in the mobile
    Linking.openURL(urls.fixConnectionIssues);
  }, []);

  return (
    <Flex flex={1} justifyContent="space-between" bg="background.drawer">
      <ScrollListContainer contentContainerStyle={{ padding: 16 }}>
        <Flex>
          <Text variant="h1" color="neutral.c100" uppercase mb={6}>
            {t("onboarding.stepPairNew.infoModal.title_1")}
          </Text>
          <IconBoxList
            items={bullets.map(item => ({
              title: (
                <Text variant="body" color="neutral.c80">
                  <Trans i18nKey={item} values={{ Os: Platform.OS }}>
                    <Text>{""}</Text>
                    <Text uppercase fontWeight="bold">
                      {""}
                    </Text>
                  </Trans>
                </Text>
              ),
              Icon: Icons.ChevronRightMedium,
            }))}
          />
          <TextLink
            type="color"
            onPress={handlePress}
            Icon={Icons.ExternalLinkMedium}
            style={{ justifyContent: "flex-start" }}
          >
            {t("onboarding.stepPairNew.infoModal.bullets.2.link")}
          </TextLink>
        </Flex>
        {Platform.OS === "ios" ? null : (
          <>
            <Flex height={1} width="100%" bg="neutral.c40" my={8} />
            <Flex>
              <Text variant="h1" color="neutral.c100" uppercase mb={6}>
                {t("onboarding.stepPairNew.infoModal.title_2")}
              </Text>
              <Text variant="body" color="neutral.c80" mb={6}>
                <Trans i18nKey="onboarding.stepPairNew.infoModal.desc_1">
                  <Text>{""}</Text>
                  <Text fontWeight="bold">{""}</Text>
                </Trans>
              </Text>
            </Flex>
          </>
        )}
      </ScrollListContainer>
      <Button m={6} type="main" size="large" onPress={navigation.goBack}>
        {t("onboarding.stepSetupDevice.hideRecoveryPhrase.cta")}
      </Button>
    </Flex>
  );
};

export default BluetoothConnection;
