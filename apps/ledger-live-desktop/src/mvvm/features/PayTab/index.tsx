import React from "react";
import { CardLogin, CardLogout, type CardLoginOauthConfig } from "@features/flow-pay-card-auth";
import { Balance } from "@features/flow-pay-card-balance";
import { DepositOptions } from "@features/flow-pay-card-deposit";
import { RequestReceive, VerifyAddress } from "@features/flow-pay-card-request";
import { getEnv } from "@shared/env";
import TrackPage from "~/renderer/analytics/TrackPage";
import PayTabHeader from "./components/PayTabHeader";
import { usePayCardBalance } from "./hooks/usePayCardBalance";
import { FeatureTour } from "@features/flow-pay-card-feature-tour";
import { usePayTabFeatureTour } from "./hooks/usePayTabFeatureTour";
import { usePayTabActionTiles } from "./hooks/usePayTabActionTiles";
import { usePayTabDepositOptions } from "./hooks/usePayTabDepositOptions";
import { usePayTabRequestReceive } from "./hooks/usePayTabRequestReceive";
import { usePayTabVerifyAddress } from "./hooks/usePayTabVerifyAddress";

// Baanx uses the same value for the client key header and the OAuth `client_id`.
const oauthConfig: CardLoginOauthConfig = {
  clientId: getEnv("CARD_BAANX_CLIENT_KEY"),
  redirectUri: getEnv("CARD_OAUTH_REDIRECT_URI"),
  deepLink: getEnv("CARD_OAUTH_DEEP_LINK"),
};

const PayTab = () => {
  const balance = usePayCardBalance();
  const featureTour = usePayTabFeatureTour();
  const deposit = usePayTabDepositOptions(balance.onTrackEvent);
  const verify = usePayTabVerifyAddress(balance.onTrackEvent);
  const request = usePayTabRequestReceive(balance.onTrackEvent, verify.openIntro);
  const actionTiles = usePayTabActionTiles(balance.onTrackEvent, deposit.open, request.open);

  return (
    <div className="flex flex-col gap-24">
      <TrackPage category="Pay" balance_filter={balance.filter} />
      {verify.phase === "intro" && <TrackPage category="Request Address Verification" />}
      <PayTabHeader />
      <Balance {...balance} actionTiles={actionTiles} />
      <DepositOptions {...deposit.depositOptions} />
      <RequestReceive {...request.requestReceive} />
      <VerifyAddress {...verify.verifyAddress} />
      {/* Each one decides whether it belongs on screen: the login while nobody is signed in, and
          the logout once somebody is. */}
      <CardLogin oauthConfig={oauthConfig} />
      <CardLogout />
      <FeatureTour {...featureTour} />
    </div>
  );
};

export default PayTab;
