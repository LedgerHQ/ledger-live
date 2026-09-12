import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, Box } from "@ledgerhq/lumen-ui-rnative";
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
    <Box lx={{ flex: 1, gap: "s16" }}>
      {displayState === "signedIn" ? (
        <>
          <Subheader>
            <SubheaderRow>
              <SubheaderTitle>{title}</SubheaderTitle>
            </SubheaderRow>
          </Subheader>
          <CardOnboardingWidget />
          {unlock ? (
            <CardNumbers unlock={unlock} cardFace={cardFace} />
          ) : (
            <CardDetails cardVisual={cardVisual} />
          )}
        </>
      ) : (
        <>
          <CardLogin
            key={`${oauthConfig.apiUrl}`}
            oauthConfig={oauthConfig}
            callback={callback}
            onTrackEvent={onTrackEvent}
          />
          <CardArtwork />
        </>
      )}
    </Box>
  );
}
