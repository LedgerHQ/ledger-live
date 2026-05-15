import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { Coins } from "@ledgerhq/lumen-ui-react/symbols";
import { useDisplayFlowData } from "../context/DisplayFlowContext";

/**
 * Step 3 — Tokens list (only reachable when descriptor `hasTokens === true`).
 *
 * The DisplayFlowLayout already skips this step for families that don't
 * support tokens. The empty state below covers the case where the family
 * supports tokens but this specific account has none yet.
 */
export function TokensScreen() {
  const { uiConfig } = useDisplayFlowData();

  if (uiConfig.tokens.length === 0) {
    return (
      <div className="flex flex-col items-center py-24">
        <span className="body-2 text-muted">No tokens on this account.</span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {uiConfig.tokens.map(token => (
        <li key={token.symbol}>
          <ListItem density="compact">
            <ListItemLeading>
              <div className="flex h-32 w-32 shrink-0 items-center justify-center">
                <Coins size={20} />
              </div>
              <ListItemContent>
                <ListItemTitle>{token.symbol}</ListItemTitle>
                <ListItemDescription>{token.name}</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <span className="body-2-semi-bold">{token.balance}</span>
            </ListItemTrailing>
          </ListItem>
        </li>
      ))}
    </ul>
  );
}
