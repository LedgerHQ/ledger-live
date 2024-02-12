import { Flex, Text, Link, IconsLegacy } from "@ledgerhq/native-ui";
import React from "react";
import { ImageSourcePropType, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Language } from "@ledgerhq/types-live";
import { DeviceModel, DeviceModelId } from "@ledgerhq/types-devices";
import { urls } from "~/utils/urls";
import Illustration from "~/images/illustration/Illustration";
import { TrackScreen } from "~/analytics";
import Button from "./wrappedUi/Button";

type Props = {
  onConfirm: () => void;
  deviceModel: DeviceModel;
  language: Language;
} & ({ canSkip: true; onSkip: () => void } | { canSkip?: false; onSkip?: undefined });

type Images = {
  [key in DeviceModelId]?: { [key in "light" | "dark"]: ImageSourcePropType };
};
const images: Images = {
  stax: {
    light: require("~/images/illustration/Light/Device/Stax.png"),
    dark: require("~/images/illustration/Dark/Device/Stax.png"),
  },
  nanoX: {
    light: require("~/images/illustration/Light/Device/XFolded.png"),
    dark: require("~/images/illustration/Dark/Device/XFolded.png"),
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
    <Flex alignItems="center" px={3}>
      <TrackScreen category="Change device language" refreshSource={false} />
      {illustration ? (
        <Illustration size={200} darkSource={illustration.dark} lightSource={illustration.light} />
      ) : null}
      <Flex mb={8}>
        <Text variant="h4" fontWeight={"semiBold"} textAlign="center">
          {t("onboarding.stepLanguage.changeDeviceLanguage", {
            language: t(`deviceLocalization.languages.${language}`),
            deviceName: deviceModel.productName,
          })}
        </Text>
        <Text mt={6} variant="bodyLineHeight" textAlign="center" color="neutral.c80">
          {t("onboarding.stepLanguage.changeDeviceLanguageDescription", {
            language: t(`deviceLocalization.languages.${language}`),
          })}
        </Text>
      </Flex>
      <Button
        size="large"
        type="main"
        onPress={onConfirm}
        alignSelf="stretch"
        event="button_clicked"
        eventProperties={{ drawer: "Change device language", button: "change device language" }}
      >
        {t("deviceLocalization.yesChangeLanguage")}
      </Button>
      {canSkip && (
        <Flex pt={7}>
          <Link size={"large"} onPress={onSkip} type="main">
            {t("common.skip")}
          </Link>
        </Flex>
      )}
      <Flex mt={7}>
        <Link
          onPress={() => Linking.openURL(urls.deviceLocalization.learnMore)}
          Icon={IconsLegacy.ExternalLinkMedium}
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
