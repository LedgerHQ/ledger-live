import React from "react";
import { CardLogin, CardLogout } from "@features/flow-pay-card-auth";
import { CardArtwork, CardVisual } from "@features/flow-pay-card-details";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { CardViewProps } from "./Card.types";

export function CardView({ title, oauthConfig, callback, cardVisual }: CardViewProps) {
  return (
    <div className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {/* TODO: orchestrate the display state here. These pieces are mutually exclusive: the card
          face shows once the holder is signed in and has a card, while the login shows only while
          nobody is signed in. Right now each child decides on its own, so they can overlap. */}
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      <Divider />
      {/* `key`: the login machine reads its config one time, when it starts. A tester who changes
          CARD_API_URL or CARD_BAANX_CLIENT_KEY in the debug settings gets a new config here, and the
          machine has to start again to build the authorize URL from it. */}
      <CardLogin
        key={`${oauthConfig.apiUrl}|${oauthConfig.clientId}`}
        oauthConfig={oauthConfig}
        callback={callback}
      />
      <CardLogout />
    </div>
  );
}
