import React from "react";
import { CardLogin, CardMore } from "@features/flow-pay-card-auth";
import { CardArtwork, CardVisual } from "@features/flow-pay-card-details";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  oauthConfig,
  callback,
  onTrackEvent,
  cardVisual,
}: CardViewProps) {
  return (
    <div className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {/* TODO: orchestrate the display state here. These pieces are mutually exclusive: the card
          face shows once the holder is signed in and has a card, while the login shows only while
          nobody is signed in. Right now each child decides on its own, so they can overlap. */}
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      <Divider />
      <CardLogin
        key={`${oauthConfig.apiUrl}`}
        oauthConfig={oauthConfig}
        callback={callback}
        onTrackEvent={onTrackEvent}
      />
      <CardMore />
    </div>
  );
}
