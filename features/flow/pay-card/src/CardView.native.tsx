import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle, Box } from "@ledgerhq/lumen-ui-rnative";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails, CardLoadingVisual } from "@features/flow-pay-card-details";
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
  onChooseCardType,
  cardState,
  onViewRewards,
  cardSettingsActions,
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
          <CardDetails
            cardVisual={cardVisual}
            assets={assets}
            formatters={{
              amount: formatters?.transactionAmount,
              date: formatters?.transactionDate,
            }}
            onShowMore={onShowMore}
            onTopUp={onTopUp}
            onChooseCardType={onChooseCardType}
            cardState={cardState}
            onViewRewards={onViewRewards}
            cardSettingsActions={cardSettingsActions}
          />
        </>
      ) : (
        <CardLogin key={login.oauthConfig.apiUrl} {...login}>
          {displayState === "resolving" && cardVisual ? (
            <CardLoadingVisual {...cardVisual} />
          ) : (
            <CardArtwork />
          )}
        </CardLogin>
      )}
    </Box>
  );
}
