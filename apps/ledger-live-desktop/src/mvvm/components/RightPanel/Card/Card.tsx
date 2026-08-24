import React from "react";
import PayCardContainer from "LLD/features/PayTab/components/PayCardContainer";

/**
 * Card
 * Right-panel content for the Pay tab: the Pay Card container frame.
 */
export const Card = () => {
  return (
    <div className="flex h-full flex-col pb-32">
      <PayCardContainer />
    </div>
  );
};
