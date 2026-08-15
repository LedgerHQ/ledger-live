import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { Balance } from "@features/flow-pay-card-balance";
import TrackPage from "~/renderer/analytics/TrackPage";
import { openURL } from "~/renderer/linking";
import PayTabHeader from "./components/PayTabHeader";
import { usePayCardBalance } from "./hooks/usePayCardBalance";
import { FeatureTour } from "@features/flow-pay-card-feature-tour";
import { usePayTabFeatureTour } from "./hooks/usePayTabFeatureTour";
import { usePayTabActionTiles } from "./hooks/usePayTabActionTiles";

const openHostedLogin = (loginUrl: string) => openURL(loginUrl, "");

const PayTab = () => {
  const balance = usePayCardBalance();
  const featureTour = usePayTabFeatureTour();
  const actionTiles = usePayTabActionTiles(balance.onTrackEvent);

  return (
    <div className="flex flex-col gap-24">
      <TrackPage category="Pay" balance_filter={balance.filter} />
      <PayTabHeader />
      <Balance {...balance} actionTiles={actionTiles} />
      <CardLogin openHostedLogin={openHostedLogin} />
      <FeatureTour {...featureTour} />
    </div>
  );
};

export default PayTab;
