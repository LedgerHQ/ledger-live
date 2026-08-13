import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { Balance } from "@features/flow-pay-card-balance";
import { DepositOptions } from "@features/flow-pay-card-deposit";
import TrackPage from "~/renderer/analytics/TrackPage";
import PayTabHeader from "./components/PayTabHeader";
import { usePayCardBalance } from "./hooks/usePayCardBalance";
import { FeatureTour } from "@features/flow-pay-card-feature-tour";
import { usePayTabFeatureTour } from "./hooks/usePayTabFeatureTour";
import { usePayTabActionTiles } from "./hooks/usePayTabActionTiles";
import { usePayTabDepositOptions } from "./hooks/usePayTabDepositOptions";
import { usePayStablecoins } from "./hooks/usePayStablecoins";

const PayTab = () => {
  const balance = usePayCardBalance();
  const featureTour = usePayTabFeatureTour();
  const { defaultStablecoins } = usePayStablecoins();
  const deposit = usePayTabDepositOptions(
    balance.onTrackEvent,
    defaultStablecoins.map(stablecoin => stablecoin.id),
  );
  const actionTiles = usePayTabActionTiles(balance.onTrackEvent, deposit.open);

  return (
    <div className="flex flex-col gap-24">
      <TrackPage category="Pay" balance_filter={balance.filter} />
      <PayTabHeader />
      <Balance {...balance} actionTiles={actionTiles} />
      <DepositOptions {...deposit.depositOptions} />
      <CardLogin />
      <FeatureTour {...featureTour} />
    </div>
  );
};

export default PayTab;
