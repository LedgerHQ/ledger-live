import React from "react";
import { Card as PayCard } from "@features/flow-pay-card";
import { PayAnalyticsProvider, type PayPageProperties } from "@features/platform-pay-analytics";
import { track } from "@shared/analytics";
import PayCardContainer from "LLD/features/PayTab/components/PayCardContainer";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { CardViewModel } from "./types";

export interface CardViewProps {
  readonly viewModel: CardViewModel;
}

const renderPage = (page: string, properties?: PayPageProperties) => (
  <TrackPage category={page} {...properties} />
);
const payAnalyticsAdapter = { track };

export const CardView = ({ viewModel }: CardViewProps) => (
  <PayAnalyticsProvider adapter={payAnalyticsAdapter} renderPage={renderPage}>
    <div className="flex h-full min-h-0 flex-col overflow-hidden pb-32">
      <PayCardContainer>
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto p-16">
          <PayCard {...viewModel} />
        </div>
      </PayCardContainer>
    </div>
  </PayAnalyticsProvider>
);
