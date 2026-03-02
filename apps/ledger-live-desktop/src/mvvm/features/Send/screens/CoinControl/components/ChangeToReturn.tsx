import React from "react";

export const ChangeToReturn = () => {
  return (
    <div
      className="flex w-full items-center justify-between py-8"
      data-testid="send-network-fees-row"
    >
      <span className="flex items-center gap-8">
        <span className="body-2">Change to return</span>
      </span>
      <span className="body-2 text-base">0,03395493 BTC</span>
    </div>
  );
};
