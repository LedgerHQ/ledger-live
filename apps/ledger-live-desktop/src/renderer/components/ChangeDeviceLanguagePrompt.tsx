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
        <Text variant="large" fontSize={20} mt={12}>
          {titleWording}
        </Text>
        <Text variant="body" textAlign="center" color="neutral.c80" mt={2}>
          {descriptionWording}
        </Text>
      </Flex>
      {showActions ? (
        <>
          <Divider />
          <Flex alignSelf="flex-end" justifySelf="flex-end" columnGap={5} py={8} px={12}>
            <Button onClick={onSkip}>{t("common.cancel")}</Button>
            <Button data-test-id="install-language-button" variant="main" onClick={onConfirm}>
              {t("deviceLocalization.changeLanguage")}
            </Button>
          </Flex>
        </>
      ) : null}
    </Flex>
  );
};

export default withV3StyleProvider(ChangeDeviceLanguagePrompt);
