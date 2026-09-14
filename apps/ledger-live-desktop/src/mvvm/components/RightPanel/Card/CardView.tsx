import React from "react";
import { Card as PayCard } from "@features/flow-pay-card";
import PayCardContainer from "LLD/features/PayTab/components/PayCardContainer";
import type { CardViewModel } from "./types";

export interface CardViewProps {
  readonly viewModel: CardViewModel;
}

export const CardView = ({ viewModel }: CardViewProps) => {
  const { title, formatCountervalue, formatTransactionAmount, balanceLabel, login } = viewModel;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pb-32">
      <PayCardContainer>
        <section aria-label={title} className="scrollbar-none min-h-0 flex-1 overflow-y-auto p-16">
          <PayCard
            title={title}
            login={login}
            formatCountervalue={formatCountervalue}
            formatTransactionAmount={formatTransactionAmount}
            balanceLabel={balanceLabel}
          />
        </section>
      </PayCardContainer>
    </div>
  );
};
