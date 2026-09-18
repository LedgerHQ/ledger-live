import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, Box } from "@ledgerhq/lumen-ui-rnative";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails } from "@features/flow-pay-card-details";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import { AddToWalletCtaWithBottomSheet } from "@features/flow-pay-card-widget/native";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  login,
  displayState,
  cardVisual,
  assets,
  formatters,
  onShowMore,
  onTopUp,
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
          <CardOnboardingWidget onTopUp={onTopUp} />
          <CardDetails
            cardVisual={cardVisual}
            assets={assets}
            formatters={{
              amount: formatters?.transactionAmount,
              date: formatters?.transactionDate,
            }}
            onTrackEvent={login.onTrackEvent}
            onShowMore={onShowMore}
            onTopUp={onTopUp}
          />
          <Box lx={{ marginHorizontal: "s16" }}>
            <AddToWalletCtaWithBottomSheet appearance="base" />
          </Box>
        </>
      ) : (
        <>
          <CardLogin key={login.oauthConfig.apiUrl} {...login} />
          <CardArtwork />
        </>
      )}
    </Box>
  );
}
