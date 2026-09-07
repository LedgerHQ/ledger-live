import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, Box } from "@ledgerhq/lumen-ui-rnative";
import { CardLogin, CardMore } from "@features/flow-pay-card-auth";
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
      <CardLogin key={`${oauthConfig.apiUrl}`} oauthConfig={oauthConfig} callback={callback} />
      <CardMore />
    </Box>
  );
}
