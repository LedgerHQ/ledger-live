import React from "react";

export const DisableTransactionBroadcastWarning = () => {
  return (
    <div
      style={{
        backgroundColor: "tomato",
        maxWidth: "200px",
        zIndex: "9999",
        position: "absolute",
        left: "100px",
      }}
    >
      DISABLE TRANSACTION BROADCAST APPLIED
    </div>
  );
};
