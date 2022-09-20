import React from "react";
import { Button, Flex, Popin, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
};

const GenuineCheckCancelModal = ({ isOpen, onClose, onSkip }: Props) => {
  const { t } = useTranslation();

  return (
    <Popin position="relative" isOpen={isOpen}>
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        height="100%"
        padding="40px"
      >
        <Text variant="h2" fontSize="20px" color="palette.warning.c80">
          {t("syncOnboarding.manual.genuineCheckCancelModal.title")}
        </Text>
        <Text variant="paragraph" fontSize="25px" textAlign="center">
          {t("syncOnboarding.manual.genuineCheckCancelModal.paragraph1")}
        </Text>
        <Text variant="paragraph" fontSize="18px" color="palette.neutral.c80" textAlign="center">
          {t("syncOnboarding.manual.genuineCheckCancelModal.paragraph2")}
        </Text>
        <Flex flexDirection="column" width="100%">
          <Button variant="main" width="100%" onClick={onClose} marginBottom="20px">
            {t("syncOnboarding.manual.genuineCheckCancelModal.checkDeviceButton")}
          </Button>
          <Button width="100%" onClick={onSkip}>
            {t("syncOnboarding.manual.genuineCheckCancelModal.cancelButton")}
          </Button>
        </Flex>
      </Flex>
    </Popin>
  );
};

export default GenuineCheckCancelModal;
