import { Flex, Text, Button, Link, Icons } from "@ledgerhq/native-ui";
import React from "react";
import { ImageSourcePropType, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Language } from "@ledgerhq/types-live";
import { DeviceModel, DeviceModelId } from "@ledgerhq/types-devices";
import { urls } from "../config/urls";
import Illustration from "../images/illustration/Illustration";

type Props = {
  onConfirm: () => void;
  deviceModel: DeviceModel;
  language: Language;
} & (
  | { canSkip: true; onSkip: () => void }
  | { canSkip?: false; onSkip?: undefined }
);

type Images = {
  [key in DeviceModelId]?: { [key in "light" | "dark"]: ImageSourcePropType };
};
const images: Images = {
  stax: {
    light: require("../images/illustration/Light/Device/Stax.png"),
    dark: require("../images/illustration/Dark/Device/Stax.png"),
  },
  nanoX: {
    light: require("../images/illustration/Light/Device/XFolded.png"),
    dark: require("../images/illustration/Dark/Device/XFolded.png"),
  },
};

const ChangeDeviceLanguagePrompt: React.FC<Props> = ({
  deviceModel,
  language,
  onConfirm,
  canSkip,
  onSkip,
}) => {
  const { t } = useTranslation();
  const illustration = images[deviceModel.id];

  return (
    <Flex alignItems="center">
      {illustration ? (
        <Illustration
          size={200}
          darkSource={illustration.dark}
          lightSource={illustration.light}
        />
      ) : null}
      <Text variant="h4" textAlign="center">
        {t("onboarding.stepLanguage.changeDeviceLanguage", {
          language: t(`deviceLocalization.languages.${language}`),
          deviceName: deviceModel.productName,
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
