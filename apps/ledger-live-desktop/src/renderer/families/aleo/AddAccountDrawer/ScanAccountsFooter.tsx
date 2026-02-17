import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Icons } from "@ledgerhq/react-ui";
import { ALEO_ADD_ACCOUNT_EVENTS_NAME } from "~/renderer/families/aleo/AddAccountDrawer/analytics/addAccount.types";
import type { FooterProps } from "LLD/features/AddAccountDrawer/screens/ScanAccounts/components/Footer";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { ADD_ACCOUNT_FLOW_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import {
  FOOTER_PADDING_BOTTOM_PX,
  FOOTER_PADDING_TOP_PX,
} from "LLD/features/AddAccountDrawer/screens/styles";

export function AleoScanAccountsFooter({
  handleConfirm,
  importableAccounts,
  scanning,
  selectedIds,
  stopSubscription,
}: FooterProps) {
  const { t } = useTranslation();
  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const handleStopScanning = () => {
    trackAddAccountEvent(ALEO_ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Stop scanning",
      page: ALEO_ADD_ACCOUNT_EVENTS_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    stopSubscription();
  };

  const renderButton = () => {
    if (scanning && importableAccounts.length === 0) {
      return null;
    }

    if (scanning) {
      return (
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
      );
    }

    return (
      <Button
        alignItems="center"
        color="neutral.c100"
        disabled={selectedIds.length === 0}
        flex={1}
        onClick={handleConfirm}
        size="xl"
        variant="main"
      >
        {t("aleo.addAccount.stepScanAccounts.cta.shareKey", { count: selectedIds.length })}
      </Button>
    );
  };

  return (
    <Flex
      justifyContent="flex-end"
      paddingBottom={FOOTER_PADDING_BOTTOM_PX}
      paddingTop={FOOTER_PADDING_TOP_PX}
      zIndex={1}
    >
      {renderButton()}
    </Flex>
  );
}
