import React from "react";
import { withV3StyleProvider } from "../styles/StyleProviderV3";
import { Flex, Text, Button } from "@ledgerhq/react-ui";

import Illustration from "~/renderer/components/Illustration";
import NanoXFoldedDark from "./assets/nano-x-folded-dark.svg";
import NanoXFoldedLight from "./assets/nano-x-folded-light.svg";
import { useTranslation } from "react-i18next";

type Props = {
    onSkip: () => void;
    onConfirm: () => void;
    descriptionWording: string;
    titleWording: string;
};

const ChangeDeviceLanguagePrompt: React.FC<Props> = ({ onSkip, onConfirm, titleWording, descriptionWording }) => {
  const { t } = useTranslation();

  return (
    <>
      <Flex alignItems="center" justifyContent="center" flexDirection="column" flex={1} px={40}>
        <Illustration
          width={251}
          height={126}
          lightSource={NanoXFoldedLight}
          darkSource={NanoXFoldedDark}
        />

        <Text variant="h1" fontSize={20} mt={80}>
          {titleWording}
        </Text>
        <Text variant="body" textAlign="center" color="neutral.c80" mt={24}>
          {descriptionWording}
        </Text>
      </Flex>
      <Flex alignSelf="flex-end" justifySelf="flex-end" columnGap={5}>
        <Button onClick={onSkip}>{t("common.cancel")}</Button>
        <Button variant="main" onClick={onConfirm}>
          {t("deviceLocalization.changeLanguage")}
        </Button>
      </Flex>
    </>
  );
};

export default withV3StyleProvider(ChangeDeviceLanguagePrompt);
