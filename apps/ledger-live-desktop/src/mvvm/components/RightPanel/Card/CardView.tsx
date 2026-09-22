import React from "react";
import { Card as PayCard } from "@features/flow-pay-card";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";
import { track } from "@shared/analytics";
import PayCardContainer from "LLD/features/PayTab/components/PayCardContainer";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { CardViewModel } from "./types";

export interface CardViewProps {
  readonly viewModel: CardViewModel;
}

const renderPage = (page: string) => <TrackPage category={page} />;
const payAnalyticsAdapter = { track };

export const CardView = ({ viewModel }: CardViewProps) => {
  const { formatters, assets, login, onShowMore, onTopUp, cardSettingsActions } = viewModel;

  return (
    <PayAnalyticsProvider adapter={payAnalyticsAdapter} renderPage={renderPage}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden pb-32">
        <PayCardContainer>
          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto p-16">
            <PayCard
              login={login}
              assets={assets}
              formatters={formatters}
              onShowMore={onShowMore}
              onTopUp={onTopUp}
              cardSettingsActions={cardSettingsActions}
            />
          </div>
        </PayCardContainer>
      </div>
    </PayAnalyticsProvider>
  );
};
