// @flow

import React from "react";

import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";

import type { StepProps } from "../../StakeModal/types";

const StepConfirmation = ({ t }: StepProps) => {
  return (
    <Box style={{ display: "flex", alignItems: "center" }} mx={40}>
      <p style={{ textAlign: "center" }}>{t("hedera.stake.flow.stopStake.confirmation")}</p>
    </Box>
  );
};

export const StepConfirmationFooter = ({
  t,
  account,
  parentAccount,
  optimisticOperation,
  transitionTo,
  onClose,
}: StepProps) => {
  return (
    <>
      <Button onClick={() => onClose()}>No</Button>
      <Button primary onClick={() => transitionTo("connectDevice")}>
        Yes
      </Button>
    </>
  );
};

export default StepConfirmation;