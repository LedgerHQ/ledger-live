import React from "react";
import { PayAnalyticsProvider, type PayPageProperties } from "@features/platform-pay-analytics";
import { track } from "@shared/analytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { PayTabView } from "./PayTabView";
import { usePayTabViewModel } from "./usePayTabViewModel";

const renderPage = (page: string, properties?: PayPageProperties) => (
  <TrackPage category={page} {...properties} />
);
const payAnalyticsAdapter = { track };

function PayTabContent() {
  return <PayTabView {...usePayTabViewModel()} />;
}

export default function PayTab() {
  return (
    <PayAnalyticsProvider adapter={payAnalyticsAdapter} renderPage={renderPage}>
      <PayTabContent />
    </PayAnalyticsProvider>
  );
}
