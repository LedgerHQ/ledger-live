import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails, CardTopUpButton } from "@features/flow-pay-card-details";
import { CardTransactions } from "@features/flow-pay-card-transactions";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import { CardAssets } from "@features/flow-pay-card-assets";
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
    <section aria-label={title} className="flex min-h-full flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {displayState === "signedIn" ? (
        <>
          <CardOnboardingWidget onTopUp={onTopUp} />
          <CardDetails
            cardVisual={cardVisual}
            formatters={{ amount: formatters?.transactionAmount }}
          />
          {assets ? (
            <div className="mt-8">
              <CardAssets {...assets} />
            </div>
          ) : null}
          <CardTransactions
            formatters={{
              amount: formatters?.transactionAmount,
              date: formatters?.transactionDate,
            }}
            onTrackEvent={login.onTrackEvent}
            onShowMore={onShowMore}
          />
          <div className="sticky bottom-0 mt-auto bg-canvas py-16">
            <CardTopUpButton onTopUp={onTopUp} />
          </div>
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
