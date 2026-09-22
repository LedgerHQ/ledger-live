import React from "react";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";
import { track } from "@shared/analytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { PayTabView } from "./PayTabView";
import { usePayTabViewModel } from "./usePayTabViewModel";

const renderPage = (page: string) => <TrackPage category={page} />;
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
