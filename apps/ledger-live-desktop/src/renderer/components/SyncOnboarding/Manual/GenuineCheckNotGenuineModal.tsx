import React from "react";
import { Button, Flex, Popin, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
};

const GenuineCheckNotGenuineModal = ({ isOpen, onClose, onSkip }: Props) => {
  const { t } = useTranslation();

  return (
    <Popin height="450px" isOpen={isOpen}>
      <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center" px={12}>
        <Text
          mb={14}
          variant="body"
          textTransform="uppercase"
          fontWeight="semiBold"
          color="palette.error.c100"
          fontSize={16}
        >
          {t("syncOnboarding.manual.genuineCheckNotGenuineModal.title")}
        </Text>
        <Text mb={8} variant="body" fontSize={24} textAlign="center">
          {t("syncOnboarding.manual.genuineCheckNotGenuineModal.paragraph1")}
        </Text>
        <Text mb={14} fontSize={16} variant="body" color="palette.neutral.c80" textAlign="center">
          {t("syncOnboarding.manual.genuineCheckNotGenuineModal.paragraph2")}
        </Text>
        <Flex flexDirection="column" width="100%">
          <Button size="large" variant="main" width="100%" onClick={onClose} mb={8}>
            {t("syncOnboarding.manual.genuineCheckNotGenuineModal.checkDeviceButton")}
          </Button>
          <Button size="large" width="100%" onClick={onSkip}>
            {t("syncOnboarding.manual.genuineCheckNotGenuineModal.cancelButton")}
          </Button>
        </Flex>
      </Flex>
    </Popin>
  );
};

export default GenuineCheckNotGenuineModal;
