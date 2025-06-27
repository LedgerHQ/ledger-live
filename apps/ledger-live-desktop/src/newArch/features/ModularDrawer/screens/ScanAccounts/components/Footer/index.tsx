import { Button, Flex, Icons } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { useTranslation } from "react-i18next";

export type FooterProps = {
  handleConfirm: () => void;
  importableAccounts: Account[];
  scanning: boolean;
  selectedIds: string[];
  stopSubscription: () => void;
};

export const Footer = ({
  handleConfirm,
  importableAccounts,
  scanning,
  selectedIds,
  stopSubscription,
}: FooterProps) => {
  const { t } = useTranslation();

  return (
    <Flex justifyContent="flex-end">
      {scanning ? (
        importableAccounts.length === 0 ? null : (
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
        )
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
