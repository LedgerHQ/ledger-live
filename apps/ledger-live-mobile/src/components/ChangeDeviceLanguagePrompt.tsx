import { Flex, Text, Button, Link, Icons } from "@ledgerhq/native-ui";
import React from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Language } from "@ledgerhq/types-live";
import NanoXFolded from "../images/devices/NanoXFolded";
import { urls } from "../config/urls";

type Props = {
  onConfirm: () => void;
  deviceName: string;
  language: Language;
} & (
  | { canSkip: true; onSkip: () => void }
  | { canSkip?: false; onSkip?: undefined }
);

const ChangeDeviceLanguagePrompt: React.FC<Props> = ({
  deviceName,
  language,
  onConfirm,
  canSkip,
  onSkip,
}) => {
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <NanoXFolded size={200} />
      <Text variant="h4" textAlign="center">
        {t("onboarding.stepLanguage.changeDeviceLanguage", {
          language: t(`deviceLocalization.languages.${language}`),
          deviceName,
        })}
      </Text>
      <Flex px={7} mt={4} mb={8}>
        <Text variant="paragraph" textAlign="center" color="neutral.c70">
          {t("onboarding.stepLanguage.changeDeviceLanguageDescription", {
            language: t(`deviceLocalization.languages.${language}`),
          })}
        </Text>
      </Flex>
      <Button type="main" onPress={onConfirm} alignSelf="stretch">
        {t("deviceLocalization.yesChangeLanguage")}
      </Button>
      {canSkip && (
        <Button mt={4} onPress={onSkip} alignSelf="stretch" type="main" outline>
          {t("common.skip")}
        </Button>
      )}
      <Flex mt={6}>
        <Link
          onPress={() => Linking.openURL(urls.deviceLocalization.learnMore)}
          Icon={Icons.ExternalLinkMedium}
          iconPosition="right"
          type="color"
          style={{ justifyContent: "flex-start" }}
        >
          {t("common.learnMore")}
        </Link>
      </Flex>
    </Flex>
  );
};

export default ChangeDeviceLanguagePrompt;
