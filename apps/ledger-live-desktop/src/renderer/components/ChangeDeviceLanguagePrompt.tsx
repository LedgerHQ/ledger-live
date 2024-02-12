import React from "react";
import { withV3StyleProvider } from "../styles/StyleProviderV3";
import { Flex, Text, Button, Divider } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";
import DeviceIllustration from "./DeviceIllustration";

type Props = {
  onSkip?: () => void;
  onConfirm?: () => void;
  descriptionWording: string;
  titleWording?: string;
  deviceModelId: DeviceModelId;
  showActions?: boolean;
};

const ChangeDeviceLanguagePrompt: React.FC<Props> = ({
  onSkip,
  onConfirm,
  titleWording,
  descriptionWording,
  deviceModelId,
  showActions = true,
}) => {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" flex={1} alignSelf="stretch">
      <Flex alignItems="center" justifyContent="center" flexDirection="column" flex={1} px={12}>
        <DeviceIllustration width={251} height={200} deviceId={deviceModelId} />
        <Text variant="large" textAlign="center" fontSize={7} mt={10}>
          {titleWording}
        </Text>
        <Text variant="body" textAlign="center" fontSize={5} color="neutral.c80" mt={6}>
          {descriptionWording}
        </Text>
      </Flex>
      {showActions ? (
        <Flex flexDirection="column" alignSelf="stretch">
          <Divider />
          <Flex
            px={12}
            alignSelf="stretch"
            flexDirection="row"
            justifyContent="space-between"
            pt={4}
            pb={1}
          >
            <Flex flex={1} />
            <Button onClick={onSkip}>{t("deviceLocalization.dontChangeLanguage")}</Button>
            <Button
              data-test-id="install-language-button"
              ml={4}
              variant="main"
              onClick={onConfirm}
            >
              {t("deviceLocalization.changeLanguage")}
            </Button>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};

export default withV3StyleProvider(ChangeDeviceLanguagePrompt);
