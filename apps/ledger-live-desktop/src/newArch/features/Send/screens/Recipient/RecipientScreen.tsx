/**
 * POC - Recipient Screen
 * This is a minimal POC to test the wizard architecture.
 * TO BE REMOVED before merging - will be implemented properly in a separate PR.
 */
import React, { useState, useCallback } from "react";
import { Button } from "@ledgerhq/ldls-ui-react";
import { Input } from "@ledgerhq/react-ui";
import { useSendFlowContext } from "../../context/SendFlowContext";
import { SEND_FLOW_STEP } from "../../types";

export function RecipientScreen() {
  const { state, navigation, transaction, currencyConfig, currentStep, direction } =
    useSendFlowContext();
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [destinationTag, setDestinationTag] = useState("");

  const { account } = state.account;
  const { transaction: tx, status, bridgePending } = state.transaction;

  const handleAddressChange = useCallback(
    (value: string) => {
      setAddress(value);
      if (value.length > 0) {
        transaction.setRecipient({
          address: value,
          memo: currencyConfig.hasMemo ? memo : undefined,
          destinationTag: currencyConfig.hasDestinationTag ? destinationTag : undefined,
        });
      }
    },
    [currencyConfig.hasMemo, currencyConfig.hasDestinationTag, memo, destinationTag, transaction],
  );

  const handleMemoChange = useCallback(
    (value: string) => {
      setMemo(value);
      if (address.length > 0) {
        transaction.setRecipient({
          address,
          memo: value,
          destinationTag: currencyConfig.hasDestinationTag ? destinationTag : undefined,
        });
      }
    },
    [address, currencyConfig.hasDestinationTag, destinationTag, transaction],
  );

  const handleDestinationTagChange = useCallback(
    (value: string) => {
      setDestinationTag(value);
      if (address.length > 0) {
        transaction.setRecipient({
          address,
          memo: currencyConfig.hasMemo ? memo : undefined,
          destinationTag: value,
        });
      }
    },
    [address, currencyConfig.hasMemo, memo, transaction],
  );

  const handleContinue = useCallback(() => {
    navigation.goToNextStep();
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goToPreviousStep();
    }
  }, [navigation]);

  const hasRecipientError = Boolean(status.errors.recipient);
  const recipientError = status.errors.recipient?.message
    ? String(status.errors.recipient.message)
    : undefined;

  const canContinue = address.length > 0 && !bridgePending;
  const accountName = account?.id || "Unknown";

  return (
    <div className="flex flex-col gap-24 px-12">
      <div className="flex flex-col gap-8">
        <h2 className="heading-2">Send</h2>
        <p className="text-muted body-2">Step: Recipient • Account: {accountName}</p>
      </div>

      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-8">
          <label className="body-2-semi-bold">Recipient Address</label>
          <Input
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter recipient address"
            error={hasRecipientError ? recipientError : undefined}
          />
        </div>

        {currencyConfig.hasMemo && (
          <div className="flex flex-col gap-8">
            <label className="body-2-semi-bold">{currencyConfig.memoLabel ?? "Memo"}</label>
            <Input
              value={memo}
              onChange={handleMemoChange}
              placeholder={currencyConfig.memoPlaceholder ?? "Optional"}
            />
          </div>
        )}

        {currencyConfig.hasDestinationTag && (
          <div className="flex flex-col gap-8">
            <label className="body-2-semi-bold">Destination Tag</label>
            <Input
              value={destinationTag}
              onChange={handleDestinationTagChange}
              placeholder="Optional destination tag"
              type="number"
            />
          </div>
        )}

        {bridgePending && <p className="text-muted body-3">Validating...</p>}

        {status.warnings.recipient && (
          <p className="text-warning body-3">{String(status.warnings.recipient.message)}</p>
        )}
      </div>

      <div className="mt-24 flex gap-16">
        {navigation.canGoBack() && (
          <Button size="sm" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button size="sm" disabled={!canContinue} onClick={handleContinue}>
          Continue
        </Button>
      </div>

      <div className="mt-24 rounded-lg bg-muted">
        <div className="flex flex-col gap-8">
          <p className="body-3-semi-bold">Debug Info</p>
          <div className="flex flex-col gap-4">
            <p className="text-muted body-4">
              Step: {currentStep} | Direction: {direction}
            </p>
            <p className="text-muted body-4">
              Address: {address || "(empty)"} | Memo: {memo || "(empty)"} | Tag:{" "}
              {destinationTag || "(empty)"}
            </p>
            <p className="text-muted body-4">
              Currency: {state.account.currency?.id || "none"} | Config: hasMemo=
              {String(currencyConfig.hasMemo)}, hasDestinationTag=
              {String(currencyConfig.hasDestinationTag)}
            </p>
            <p className="text-muted body-4">
              Bridge Pending: {String(bridgePending)} | Has Error: {String(hasRecipientError)}
            </p>
            <p className="text-muted body-4">
              TX Recipient: {tx?.recipient || "(none)"} | TX Amount: {tx?.amount?.toString() || "0"}
            </p>
            <p className="text-muted body-4">
              Status Errors:{" "}
              {Object.keys(status.errors).length > 0 ? JSON.stringify(status.errors) : "none"}
            </p>
            <div className="mt-8 flex gap-8">
              <Button
                size="sm"
                onClick={() => navigation.goToStep(SEND_FLOW_STEP.AMOUNT)}
                disabled={!navigation.canGoForward()}
              >
                Go to Amount
              </Button>
              <Button
                size="sm"
                onClick={() => navigation.goToStep(SEND_FLOW_STEP.SIGNATURE)}
                disabled={!navigation.canGoForward()}
              >
                Go to Signature
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
