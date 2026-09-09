import React from "react";
import { CardLogin, CardMore } from "@features/flow-pay-card-auth";
import { CardArtwork, CardVisual, Freeze } from "@features/flow-pay-card-details";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  oauthConfig,
  callback,
  openHostedLogin,
  openHostedPage,
  onTrackEvent,
  cardVisual,
}: CardViewProps) {
  return (
    <div className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      <CardOnboardingWidget />
      {/* TODO: orchestrate the display state here. These pieces are mutually exclusive: the card
          face shows once the holder is signed in and has a card, while the login shows only while
          nobody is signed in. Right now each child decides on its own, so they can overlap. */}
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      <Freeze />
      <Divider />
      <CardLogin
        key={`${oauthConfig.apiUrl}`}
        oauthConfig={oauthConfig}
        callback={callback}
        openHostedLogin={openHostedLogin}
        openHostedPage={openHostedPage}
        onTrackEvent={onTrackEvent}
      />
      <CardMore />
    </div>
  );
}
