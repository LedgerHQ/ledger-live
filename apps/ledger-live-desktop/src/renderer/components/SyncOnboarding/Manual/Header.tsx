import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";

export type Props = {
  onClose: () => void;
  onHelp: () => void;
};

const Header = ({ onClose, onHelp }: Props) => {
  const { t } = useTranslation();

  return (
    <Flex zIndex={200} px={8} py={8} justifyContent="flex-end">
      <Button ml={4} onClick={onHelp} data-test-id="manual-help-button">
        {t("syncOnboarding.manual.header.helpButton")}
      </Button>
      <Button ml={12} variant="neutral" onClick={onClose} Icon={CloseMedium} />
    </Flex>
  );
};

export default Header;
