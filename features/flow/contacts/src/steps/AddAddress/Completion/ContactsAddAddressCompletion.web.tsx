import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { AddAddressPlaceholderViewProps } from "../Flow/types";

export function ContactsAddAddressCompletion({
  title,
  buttonLabel,
  testID,
  onContinue,
}: AddAddressPlaceholderViewProps): React.JSX.Element {
  return (
    <div className="flex min-h-256 flex-col justify-between gap-24" data-testid={testID}>
      <div className="flex flex-1 items-center justify-center">
        <h2 className="heading-3-semi-bold text-base">{title}</h2>
      </div>
      <Button
        appearance="base"
        className="w-full"
        data-testid={`${testID}-continue`}
        onClick={onContinue}
        size="lg"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
