import React from "react";
import { FlowStatus } from "LLD/features/FlowWizard/types";
import { SuccessContent } from "./SuccessContent";
import { InfoContent } from "./InfoContent";
import { ErrorContent } from "./ErrorContent";

interface ConfirmationBodyProps {
  status: FlowStatus;
  transactionError?: Error;
}

export const ConfirmationBody: React.FC<ConfirmationBodyProps> = ({ status, transactionError }) => {
  return (
    <div className="flex flex-col items-center gap-24">
      {status === "success" && <SuccessContent />}

      {status === "idle" && (
        <InfoContent
          titleKey="errors.UserRefusedOnDevice.title"
          descriptionKey="errors.UserRefusedOnDevice.description"
        />
      )}

      {status === "error" && <ErrorContent error={transactionError} />}
    </div>
  );
};
