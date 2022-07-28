import { Flex, Text, Button, Link, Icons } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { SupportedLanguages } from "../context/Locale";
import NanoXFolded from "../images/devices/NanoXFolded";

type Props = { currentLocale: SupportedLanguages; onConfirm: () => void; descriptionWording: string } & (
  | { canSkip: true; onSkip: () => void }
  | { canSkip?: false; onSkip?: undefined}
);

const ChangeDeviceLanguagePrompt: React.FC<Props> = ({
  descriptionWording,
  onConfirm,
  canSkip,
  onSkip,
}) => {
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <NanoXFolded size={200} />
      <Text variant="h4" textAlign="center">
        {t("onboarding.stepLanguage.changeDeviceLanguage")}
      </Text>
      <Flex px={7} mt={4} mb={8}>
        <Text variant="paragraph" textAlign="center" color="neutral.c70">
          {descriptionWording}
        </Text>
      </Flex>
      <Button
        type="main"
        onPress={onConfirm}
        alignSelf="stretch"
      >
        {t("deviceLocalization.changeLanguage")}
      </Button>
      {canSkip && (
        <Button mt={4} onPress={onSkip} alignSelf="stretch" type="main" outline>
          {t("common.skip")}
        </Button>
      )}
      <Flex mt={6}>
        <Link
          onPress={() => console.log("TODO: open link")}
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
