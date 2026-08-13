import React from "react";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { PayCardBalanceViewProps } from "../../types";
import { PayCardBalanceBody } from "./PayCardBalanceBody";

export function PayCardBalanceView(props: PayCardBalanceViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="pay-card-balance">
      <PayCardBalanceBody {...props} />
      <Divider orientation="horizontal" />
    </div>
  );
}
