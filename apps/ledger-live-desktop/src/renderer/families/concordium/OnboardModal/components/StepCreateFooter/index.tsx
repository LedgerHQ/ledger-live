import React from "react";
import { Trans } from "react-i18next";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import { StepProps } from "../../types";

const StepCreateFooter = ({
  currency,
  isProcessing,
  onboardingStatus,
  onCreateAccount,
  onAddAccounts,
}: StepProps) => {
  const renderActionButton = () => {
    switch (onboardingStatus) {
      case AccountOnboardStatus.SUCCESS:
        return (
          <Button primary disabled={isProcessing} onClick={onAddAccounts}>
            <Trans i18nKey="common.continue" />
          </Button>
        );

      case AccountOnboardStatus.ERROR:
        return (
          <Button primary disabled={isProcessing} onClick={onCreateAccount}>
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      {renderActionButton()}
    </Box>
  );
};

export default StepCreateFooter;
