import React from "react";
import { CardLogin, CardLogout } from "@features/flow-pay-card-auth";
import { CardArtwork, CardVisual } from "@features/flow-pay-card-details";
import type { CardViewProps } from "./Card.types";

export function CardView({ oauthConfig, callback, cardVisual }: CardViewProps) {
  return (
    <>
      {/* TODO: orchestrate the display state here. These pieces are mutually exclusive: the card
          face shows once the holder is signed in and has a card, while the login shows only while
          nobody is signed in. Right now each child decides on its own, so they can overlap. */}
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      <CardLogin oauthConfig={oauthConfig} callback={callback} />
      <CardLogout />
    </>
  );
}
