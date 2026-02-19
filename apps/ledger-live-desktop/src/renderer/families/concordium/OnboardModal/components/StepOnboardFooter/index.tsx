import React from "react";
import { Trans } from "react-i18next";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../../types";

const StepOnboardFooter = ({
  isProcessing,
  onboardingStatus,
  onPair,
  isPairing,
  onCreateAccount,
  onCancel,
}: StepProps) => {
  const renderActionButton = () => {
    switch (true) {
      case onboardingStatus === AccountOnboardStatus.INIT && !isPairing:
        return (
          <Button primary onClick={onPair}>
            <Trans i18nKey="families.concordium.addAccount.acknowledge.allow" />
          </Button>
        );
      case onboardingStatus === AccountOnboardStatus.SUCCESS:
        return (
          <Button primary disabled={isProcessing} onClick={onCreateAccount}>
            <Trans i18nKey="common.continue" />
          </Button>
        );
      case onboardingStatus === AccountOnboardStatus.ERROR:
        return (
          <Button primary disabled={isProcessing} onClick={onPair}>
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <Button onClick={onCancel}>
        <Trans i18nKey="common.cancel" />
      </Button>

      {renderActionButton()}
    </Box>
  );
};

export default StepOnboardFooter;
