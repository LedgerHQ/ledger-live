/**
 * POC - Signature Screen
 * This is a minimal POC to test the wizard architecture.
 * TO BE REMOVED before merging - will be implemented properly in a separate PR.
 */
import React, { useCallback } from "react";
import { Button } from "@ledgerhq/ldls-ui-react";
import { useSendFlowContext } from "../../context/SendFlowContext";

export function SignatureScreen() {
  const { state, navigation, operation } = useSendFlowContext();

  const { transaction: tx, status } = state.transaction;

  const handleBack = useCallback(() => {
    navigation.goToPreviousStep();
  }, [navigation]);

  const handleSimulateSign = useCallback(() => {
    // POC: Simulate successful signature
    operation.onSigned();
    navigation.goToNextStep();
  }, [operation, navigation]);

  return (
    <div className="flex flex-col gap-24 p-24">
      <div className="flex flex-col gap-8">
        <h2 className="heading-2">Sign Transaction</h2>
        <p className="text-muted body-2">Step: Signature</p>
      </div>

      <div className="flex flex-col gap-16 rounded-lg bg-muted p-16">
        <h3 className="body-2-semi-bold">Transaction Summary</h3>

        <div className="flex flex-col gap-8">
          <div className="flex justify-between">
            <span className="text-muted body-3">To:</span>
            <span className="body-3">{tx?.recipient ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted body-3">Amount:</span>
            <span className="body-3">{tx?.amount?.toString() ?? "0"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted body-3">Fees:</span>
            <span className="body-3">{status.estimatedFees?.toString() ?? "0"}</span>
          </div>
          <div className="flex justify-between border-t border-muted pt-8">
            <span className="body-3-semi-bold">Total:</span>
            <span className="body-3-semi-bold">{status.totalSpent?.toString() ?? "0"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-canvas-muted p-16 text-center">
        <p className="text-muted body-2">Connect your Ledger device and confirm the transaction</p>
        <p className="mt-8 text-muted body-3">(POC: Click Sign to simulate)</p>
      </div>

      <div className="mt-24 flex gap-16">
        <Button size="sm" onClick={handleBack}>
          Back
        </Button>
        <Button size="sm" onClick={handleSimulateSign}>
          Sign (POC)
        </Button>
      </div>
    </div>
  );
}
