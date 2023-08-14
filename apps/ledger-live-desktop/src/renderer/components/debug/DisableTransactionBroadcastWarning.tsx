import React from "react";
export const DisableTransactionBroadcastWarning = () => {
  return (
    <div
      style={{
        backgroundColor: "tomato",
        zIndex: "9999",
        position: "absolute",
        fontSize: "10px",
        maxWidth: "250px",
        top: "4px",
        left: "150px",
      }}
    >
      DISABLE TRANSACTION BROADCAST APPLIED
    </div>
  );
};
