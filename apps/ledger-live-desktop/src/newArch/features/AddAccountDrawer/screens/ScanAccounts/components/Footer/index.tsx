import { Button, Flex, Icons } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
} from "../../../../analytics/addAccount.types";
import useAddAccountAnalytics from "../../../../analytics/useAddAccountAnalytics";
import { FOOTER_PADDING_BOTTOM_PX, FOOTER_PADDING_TOP_PX } from "../../../styles";

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

  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const handleStopScanning = () => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Stop scanning",
      page: ADD_ACCOUNT_EVENTS_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    stopSubscription();
  };

  return (
    <Flex
      justifyContent="flex-end"
      paddingBottom={FOOTER_PADDING_BOTTOM_PX}
      paddingTop={FOOTER_PADDING_TOP_PX}
      zIndex={1}
    >
      {scanning ? (
        importableAccounts.length === 0 ? null : (
          <Button
            alignItems="center"
            flex={1}
            Icon={<Icons.Pause />}
            iconPosition="left"
            onClick={handleStopScanning}
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
