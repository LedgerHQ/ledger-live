import React from "react";
import { Card as PayCard } from "@features/flow-pay-card";
import PayCardContainer from "LLD/features/PayTab/components/PayCardContainer";
import type { CardViewModel } from "./types";

export interface CardViewProps {
  readonly viewModel: CardViewModel;
}

/**
 * CardView
 * Right-panel content for the Pay tab: the Pay Card container framing the card visual and the
 * authentication controls.
 */
export const CardView = ({ viewModel }: CardViewProps) => {
  const { title, formatCountervalue, balanceLabel, oauthConfig, onTrackEvent } = viewModel;

  return (
    <div className="flex h-full flex-col pb-32">
      <PayCardContainer>
        <div className="p-16">
          <PayCard
            title={title}
            oauthConfig={oauthConfig}
            formatCountervalue={formatCountervalue}
            balanceLabel={balanceLabel}
            onTrackEvent={onTrackEvent}
          />
        </div>
      </PayCardContainer>
    </div>
  );
};
