import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardActions, CardArtwork, CardNumbers, CardVisual } from "@features/flow-pay-card-details";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { CardViewProps } from "./Card.types";

// QA bypass until LIVE-34740. Same as Freeze.
const REQUIRE_CARD_NUMBERS_SIGN_IN = false;

export function CardView({
  title,
  oauthConfig,
  callback,
  onTrackEvent,
  isSignedIn,
  cardVisual,
  unlock,
}: CardViewProps) {
  const showCardNumbers = Boolean(unlock) && (!REQUIRE_CARD_NUMBERS_SIGN_IN || isSignedIn);
  const cardFace = cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />;

  return (
    <div className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      <CardOnboardingWidget />
      {showCardNumbers && unlock ? (
        <CardNumbers unlock={unlock} cardFace={cardFace} />
      ) : (
        <>
          {cardFace}
          <CardActions />
        </>
      )}
      <Divider />
      <CardLogin
        key={`${oauthConfig.apiUrl}`}
        oauthConfig={oauthConfig}
        callback={callback}
        onTrackEvent={onTrackEvent}
      />
    </div>
  );
}
