import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, Box } from "@ledgerhq/lumen-ui-rnative";
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
    <Box lx={{ flex: 1, gap: "s16" }}>
      {displayState === "signedIn" ? (
        <>
          <Subheader>
            <SubheaderRow>
              <SubheaderTitle>{title}</SubheaderTitle>
            </SubheaderRow>
          </Subheader>
          <CardOnboardingWidget />
          <CardDetails cardVisual={cardVisual} />
          <CardAssets />
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
