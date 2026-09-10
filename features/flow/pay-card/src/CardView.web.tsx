import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardDetails } from "@features/flow-pay-card-details";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
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
      <CardOnboardingWidget />
      {/* TODO: orchestrate the display state here. These pieces are mutually exclusive: the card
          face shows once the holder is signed in and has a card, while the login shows only while
          nobody is signed in. Right now each child decides on its own, so they can overlap. */}
      <CardDetails cardVisual={cardVisual} />
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
