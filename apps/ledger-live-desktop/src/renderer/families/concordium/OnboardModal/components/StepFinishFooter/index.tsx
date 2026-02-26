import React from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../../types";

const StepFinishFooter = ({ t, onComplete }: StepProps) => {
  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" grow>
      <Button
        event="Page AddAccounts Step 2 Close"
        data-testid="add-accounts-finish-close-button"
        primary
        onClick={onComplete}
        aria-label="Complete Concordium account setup"
      >
        {t("common.done")}
      </Button>
    </Box>
  );
};

export default StepFinishFooter;
