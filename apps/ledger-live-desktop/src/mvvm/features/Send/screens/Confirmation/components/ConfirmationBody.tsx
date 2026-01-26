import React from "react";
import type { FlowStatus } from "@ledgerhq/live-common/flows/wizard/types";
import { SuccessContent } from "./Content/SuccessContent";
import { InfoContent } from "./Content/InfoContent";
import { ErrorContent } from "./Content/ErrorContent";

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
