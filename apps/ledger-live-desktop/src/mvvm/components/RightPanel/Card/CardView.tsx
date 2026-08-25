import React from "react";
import { CardVisual } from "@features/flow-pay-card-details";
import PayCardContainer from "LLD/features/PayTab/components/PayCardContainer";
import type { CardViewModel } from "./types";

export interface CardViewProps {
  readonly viewModel: CardViewModel;
}

/**
 * CardView
 * Right-panel content for the Pay tab: the Pay Card container framing the card visual.
 */
export const CardView = ({ viewModel }: CardViewProps) => {
  const { balance, formatCountervalue, balanceLabel } = viewModel;

  return (
    <div className="flex h-full flex-col pb-32">
      <PayCardContainer>
        <div className="p-16">
          <CardVisual
            balance={balance}
            formatCountervalue={formatCountervalue}
            balanceLabel={balanceLabel}
          />
        </div>
      </PayCardContainer>
    </div>
  );
};
