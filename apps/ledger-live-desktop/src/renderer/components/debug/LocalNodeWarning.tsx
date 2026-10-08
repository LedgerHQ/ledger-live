import React from "react";

interface LocalNodeWarningProps {
  currencies: readonly string[];
}

/**
 * Always visible while some currencies run on their local node: balances, history and
 * broadcasts for them come from a local chain, not from mainnet.
 */
export const LocalNodeWarning: React.FC<LocalNodeWarningProps> = ({ currencies }) => (
  <div
    role="status"
    style={{
      backgroundColor: "tomato",
      color: "white",
      zIndex: "9999",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      padding: "2px 8px",
      fontSize: "11px",
      fontWeight: 600,
      textAlign: "center",
      pointerEvents: "none",
    }}
  >
    LOCAL NODE: {currencies.join(", ")} run on localhost, not on mainnet
  </div>
);
