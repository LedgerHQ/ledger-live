import { Button, Flex, Icons } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";

export type FooterProps = {
  scanning: boolean;
  selectedIds: string[];
  stopSubscription: () => void;
  handleConfirm: () => void;
};

export const Footer = ({ scanning, selectedIds, stopSubscription, handleConfirm }: FooterProps) => {
  const { t } = useTranslation();

  return (
    <Flex justifyContent="flex-end">
      {scanning ? (
        <Button
          alignItems="center"
          flex={1}
          Icon={<Icons.Pause />}
          iconPosition="left"
          onClick={() => stopSubscription()}
          size="xl"
          variant="main"
        >
          {t("modularAssetDrawer.scanAccounts.cta.stopScanning")}
        </Button>
      ) : (
        <Button
          alignItems="center"
          color="neutral.c100"
          disabled={selectedIds.length === 0}
          flex={1}
          onClick={handleConfirm}
          size="xl"
          variant="main"
        >
          {t("modularAssetDrawer.addAccounts.cta.confirm")}
        </Button>
      )}
    </Flex>
  );
};
