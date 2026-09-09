import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, Box } from "@ledgerhq/lumen-ui-rnative";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardDetails } from "@features/flow-pay-card-details";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  oauthConfig,
  callback,
  onTrackEvent,
  isSignedIn,
  cardVisual,
}: CardViewProps) {
  return (
    <Box lx={{ flex: 1, gap: "s16" }}>
      {isSignedIn ? (
        <Subheader>
          <SubheaderRow>
            <SubheaderTitle>{title}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      ) : null}
      <CardOnboardingWidget />
      {/* TODO: orchestrate the display state here. The card face + details show once the holder is
          signed in and has a card, while the login shows only while nobody is signed in. Right now
          each child decides on its own, so they can overlap. */}
      <CardDetails cardVisual={cardVisual} />
      <CardLogin
        key={`${oauthConfig.apiUrl}`}
        oauthConfig={oauthConfig}
        callback={callback}
        onTrackEvent={onTrackEvent}
      />
    </Box>
  );
}
