import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails, CardNumbers, CardVisual } from "@features/flow-pay-card-details";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  oauthConfig,
  callback,
  onTrackEvent,
  displayState,
  cardVisual,
  unlock,
}: CardViewProps) {
  const cardFace = cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />;

  return (
    <div className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {displayState === "signedIn" ? (
        <>
          <CardOnboardingWidget />
          {unlock ? (
            <CardNumbers unlock={unlock} cardFace={cardFace} />
          ) : (
            <CardDetails cardVisual={cardVisual} />
          )}
        </>
      ) : (
        <>
          <CardArtwork />

          <CardLogin
            key={`${oauthConfig.apiUrl}`}
            oauthConfig={oauthConfig}
            callback={callback}
            onTrackEvent={onTrackEvent}
          />
        </>
      )}
    </div>
  );
}
