import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, Box } from "@ledgerhq/lumen-ui-rnative";
import { CardLogin, CardLogout } from "@features/flow-pay-card-auth";
import { CardArtwork, CardVisual } from "@features/flow-pay-card-details";
import type { CardViewProps } from "./Card.types";

export function CardView({ title, oauthConfig, callback, cardVisual }: CardViewProps) {
  return (
    <Box lx={{ flex: 1, gap: "s16" }}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      {/* TODO: orchestrate the display state here. These pieces are mutually exclusive: the card
          face shows once the holder is signed in and has a card, while the login shows only while
          nobody is signed in. Right now each child decides on its own, so they can overlap. */}
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      {/* `key`: the login machine reads its config one time, when it starts. A tester who changes
          CARD_API_URL or CARD_BAANX_CLIENT_KEY in the debug settings gets a new config here, and the
          machine has to start again to build the authorize URL from it. */}
      <CardLogin
        key={`${oauthConfig.apiUrl}|${oauthConfig.clientId}`}
        oauthConfig={oauthConfig}
        callback={callback}
      />
      <CardLogout />
    </Box>
  );
}
