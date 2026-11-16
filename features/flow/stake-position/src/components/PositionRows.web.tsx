import React, { type ReactNode } from "react";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
} from "@ledgerhq/lumen-ui-react";
import type { StakePositionAmount } from "../types";

export function PositionRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <DescriptionItem>
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>{children}</DescriptionItemTrailing>
    </DescriptionItem>
  );
}

export function PositionAmount({ amount }: Readonly<{ amount: StakePositionAmount }>) {
  return (
    <div className="flex flex-col items-end">
      <DescriptionItemValue>{amount.crypto}</DescriptionItemValue>
      {amount.fiat ? <span className="body-3 text-muted">{amount.fiat}</span> : null}
    </div>
  );
}
