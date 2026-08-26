import React from "react";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { BalanceViewProps } from "../../types";
import { BalanceBody } from "./BalanceBody";

export function BalanceView(props: BalanceViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="pay-card-balance">
      <BalanceBody {...props} />
      <Divider orientation="horizontal" />
    </div>
  );
}
