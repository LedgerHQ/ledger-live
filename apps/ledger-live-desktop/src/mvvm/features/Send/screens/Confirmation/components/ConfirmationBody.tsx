import React from "react";
import { SuccessContent } from "./Content/SuccessContent";
import { InfoContent } from "./Content/InfoContent";
import { ErrorContent } from "./Content/ErrorContent";
import { FLOW_STATUS, type FlowStatus } from "@ledgerhq/live-common/flows/wizard/types";

interface ConfirmationBodyProps {
  status: FlowStatus;
  transactionError?: Error;
}

export const ConfirmationBody: React.FC<ConfirmationBodyProps> = ({ status, transactionError }) => {
  return (
    <div className="flex flex-col items-center gap-24">
      {status === FLOW_STATUS.SUCCESS && <SuccessContent />}

      {status === FLOW_STATUS.IDLE && (
        <InfoContent
          titleKey="errors.UserRefusedOnDevice.title"
          descriptionKey="errors.UserRefusedOnDevice.description"
        />
      )}

      {status === FLOW_STATUS.ERROR && <ErrorContent error={transactionError} />}
    </div>
  );
};
