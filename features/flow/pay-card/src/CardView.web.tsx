import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails } from "@features/flow-pay-card-details";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import { CardAssets } from "@features/flow-pay-card-assets";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  oauthConfig,
  callback,
  onTrackEvent,
  displayState,
  cardVisual,
}: CardViewProps) {
  return (
    <div className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {displayState === "signedIn" ? (
        <>
          <CardOnboardingWidget />
          <CardDetails cardVisual={cardVisual} />
          <CardAssets />
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
