import React from "react";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { BalanceViewProps } from "../../types";
import { ActionTiles } from "../ActionTiles";
import { BalanceBody } from "./BalanceBody";

export function BalanceView(props: BalanceViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="pay-card-balance">
      <BalanceBody {...props} />
      {props.actionTiles && <ActionTiles {...props.actionTiles} />}
      <Divider orientation="horizontal" />
    </div>
  );
}
