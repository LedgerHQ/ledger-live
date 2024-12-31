import React from "react";

interface DisableTransactionBroadcastWarningProps {
  value: string | undefined;
}

export const DisableTransactionBroadcastWarning: React.FC<
  DisableTransactionBroadcastWarningProps
> = ({ value }) => {
  const displayValue = value === "1" ? "TRUE" : value === "0" ? "FALSE" : value;

  return (
    <div
      style={{
        backgroundColor: "tomato",
        zIndex: "9999",
        position: "absolute",
        fontSize: "10px",
        maxWidth: "300px",
        top: "4px",
        left: "150px",
      }}
    >
      DISABLE TRANSACTION BROADCAST APPLIED: {displayValue}
    </div>
  );
};
