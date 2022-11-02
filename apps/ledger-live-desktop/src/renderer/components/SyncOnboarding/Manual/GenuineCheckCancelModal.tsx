import React from "react";
import { Button, Flex, Popin, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  productName: string;
};

const GenuineCheckCancelModal = ({ isOpen, onClose, onSkip, productName }: Props) => {
  const { t } = useTranslation();

  return (
    <Popin height="450px" isOpen={isOpen}>
      <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center" px={12}>
        <Text
          mb={14}
          variant="body"
          textTransform="uppercase"
          fontWeight="semiBold"
          color="palette.warning.c80"
          fontSize={16}
        >
          {t("syncOnboarding.manual.genuineCheckCancelModal.title")}
        </Text>
        <Text mb={8} variant="body" fontSize={24} textAlign="center">
          {t("syncOnboarding.manual.genuineCheckCancelModal.paragraph1")}
        </Text>
        <Text mb={14} fontSize={16} variant="body" color="palette.neutral.c80" textAlign="center">
          {t("syncOnboarding.manual.genuineCheckCancelModal.paragraph2", {
            deviceName: productName,
          })}
        </Text>
        <Flex flexDirection="column" width="100%">
          <Button size="large" variant="main" width="100%" onClick={onClose} mb={8}>
            {t("syncOnboarding.manual.genuineCheckCancelModal.checkDeviceButton")}
          </Button>
          <Button size="large" width="100%" onClick={onSkip}>
            {t("syncOnboarding.manual.genuineCheckCancelModal.cancelButton")}
          </Button>
        </Flex>
      </Flex>
    </Popin>
  );
};

export default GenuineCheckCancelModal;
