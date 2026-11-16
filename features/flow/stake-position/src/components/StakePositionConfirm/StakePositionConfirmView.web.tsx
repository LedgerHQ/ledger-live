import React from "react";
import {
  Banner,
  Button,
  DescriptionItemValue,
  DialogBody,
  DialogFooter,
} from "@ledgerhq/lumen-ui-react";
import { PositionAmount, PositionRow } from "../PositionRows";
import type { StakePositionConfirmViewProps } from "./StakePositionConfirmView.types";

export function StakePositionConfirmView({
  labels,
  amount,
  validatorName,
  fees,
  errorContent,
  isPending,
  isConfirmDisabled,
  onConfirm,
  testID,
}: StakePositionConfirmViewProps) {
  return (
    <>
      <DialogBody data-testid={testID}>
        <div className="flex flex-col gap-16">
          <p className="body-2 text-muted">{labels.description}</p>
          <div className="flex flex-col gap-8">
            <PositionRow label={labels.amount}>
              <PositionAmount amount={amount} />
            </PositionRow>
            <PositionRow label={labels.validator}>
              <DescriptionItemValue>{validatorName}</DescriptionItemValue>
            </PositionRow>
            {fees ? (
              <PositionRow label={labels.fees}>
                <DescriptionItemValue>{fees}</DescriptionItemValue>
              </PositionRow>
            ) : null}
          </div>
          {errorContent ? <Banner appearance="error" description={errorContent} /> : null}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          appearance="base"
          size="lg"
          isFull
          loading={isPending}
          disabled={isConfirmDisabled}
          onClick={onConfirm}
        >
          {labels.cta}
        </Button>
      </DialogFooter>
    </>
  );
}
