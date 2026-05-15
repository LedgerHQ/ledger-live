import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ArrowDown, ArrowUp } from "@ledgerhq/lumen-ui-react/symbols";
import { useDisplayFlowData } from "../context/DisplayFlowContext";

/**
 * Step 2 — Recent transactions (last 5 real `account.operations`).
 *
 * The descriptor already mapped `OperationType` to a generic "send" / "receive"
 * tag and formatted amounts with the family unit, so this screen is fully
 * coin-agnostic.
 */
export function TransactionsScreen() {
  const { uiConfig } = useDisplayFlowData();

  if (uiConfig.recentTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center py-24">
        <span className="body-2 text-muted">No recent transactions.</span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {uiConfig.recentTransactions.map(tx => (
        <li key={tx.hash}>
          <ListItem density="compact">
            <ListItemLeading>
              <div className="flex h-32 w-32 shrink-0 items-center justify-center">
                {tx.type === "receive" ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
              </div>
              <ListItemContent>
                <ListItemTitle>{tx.type === "receive" ? "Received" : "Sent"}</ListItemTitle>
                <ListItemDescription>{tx.date}</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <span className="body-2-semi-bold">
                {tx.type === "receive" ? "+" : "-"}
                {tx.amount}
              </span>
            </ListItemTrailing>
          </ListItem>
        </li>
      ))}
    </ul>
  );
}
