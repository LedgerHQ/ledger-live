import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails } from "@features/flow-pay-card-details";
import { CardTransactions } from "@features/flow-pay-card-transactions";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import { CardAssets } from "./CardAssets";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  login,
  displayState,
  cardVisual,
  assets,
  formatters,
  unlock,
  onShowMore,
}: CardViewProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {displayState === "signedIn" ? (
        <>
          <CardOnboardingWidget />
          <CardDetails cardVisual={cardVisual} unlock={unlock} />
          <CardTransactions
            formatters={{
              amount: formatters?.transactionAmount,
              date: formatters?.transactionDate,
            }}
            onTrackEvent={login.onTrackEvent}
            onShowMore={onShowMore}
          />
          {assets ? <CardAssets {...assets} /> : null}
        </>
      ) : (
        <>
          <CardArtwork />

          <CardLogin key={login.oauthConfig.apiUrl} {...login} />
        </>
      )}
    </section>
  );
}
