/**
 * POC - Confirmation Screen
 * This is a minimal POC to test the wizard architecture.
 * TO BE REMOVED before merging - will be implemented properly in a separate PR.
 */
import React, { useCallback, useMemo, useRef } from "react";
import { Button } from "@ledgerhq/react-ui";
import { useSendFlowContext } from "../../context/SendFlowContext";
import { FLOW_STATUS } from "../../../FlowWizard/types";

export function ConfirmationScreen() {
  const { state, close, operation, status } = useSendFlowContext();

  const { signed, optimisticOperation, transactionError } = state.operation;
  const { transaction: tx } = state.transaction;
  const previousStatusRef = useRef(state.flowStatus);

  const isSuccess = signed && !transactionError;
  const isError = Boolean(transactionError);

  useMemo(() => {
    if (isSuccess && previousStatusRef.current !== FLOW_STATUS.SUCCESS) {
      status.setSuccess();
      previousStatusRef.current = FLOW_STATUS.SUCCESS;
    } else if (isError && previousStatusRef.current !== FLOW_STATUS.ERROR) {
      status.setError();
      previousStatusRef.current = FLOW_STATUS.ERROR;
    }
  }, [isSuccess, isError, status]);

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  const handleRetry = useCallback(() => {
    operation.onRetry();
    status.resetStatus();
    previousStatusRef.current = FLOW_STATUS.IDLE;
  }, [operation, status]);

  return (
    <div className="flex flex-col gap-24 p-24">
      <div className="flex flex-col gap-8 text-center">
        {isSuccess && (
          <>
            <div className="text-center text-success">
              <span className="heading-1">✓</span>
            </div>
            <h2 className="heading-2">Transaction Sent!</h2>
            <p className="text-muted body-2">Your transaction has been broadcast to the network.</p>
          </>
        )}

        {isError && (
          <>
            <div className="text-center text-error">
              <span className="heading-1">✗</span>
            </div>
            <h2 className="heading-2">Transaction Failed</h2>
            <p className="text-error body-2">{transactionError?.message}</p>
          </>
        )}

        {!isSuccess && !isError && (
          <>
            <h2 className="heading-2">Processing...</h2>
            <p className="text-muted body-2">Please wait while we process your transaction.</p>
          </>
        )}
      </div>

      {isSuccess && (
        <div className="flex flex-col gap-16 rounded-lg bg-muted px-16">
          <div className="flex justify-between">
            <span className="text-muted body-3">To:</span>
            <span className="body-3">{tx?.recipient ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted body-3">Amount:</span>
            <span className="body-3">{tx?.amount?.toString() ?? "0"}</span>
          </div>
          {optimisticOperation && (
            <div className="flex justify-between">
              <span className="text-muted body-3">Operation ID:</span>
              <span className="text-muted body-4">{optimisticOperation.id.slice(0, 16)}...</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-24 flex justify-center gap-16">
        {isError && (
          <Button variant="shade" onClick={handleRetry}>
            Retry
          </Button>
        )}
        <Button variant="main" onClick={handleClose}>
          {isSuccess ? "Done" : "Close"}
        </Button>
      </div>
    </div>
  );
}
