import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails, CardTopUpButton } from "@features/flow-pay-card-details";
import { CardTransactions } from "@features/flow-pay-card-transactions";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import { CardAssets } from "@features/flow-pay-card-assets";
import type { CardViewProps } from "./Card.types";

export function CardView({
  title,
  disclaimer,
  login,
  displayState,
  cardVisual,
  assets,
  formatters,
  onShowMore,
  onTopUp,
  onChooseCardType,
  onViewRewards,
  cardSettingsActions,
}: CardViewProps) {
  const isSignedIn = displayState === "signedIn";

  return (
    <section aria-label={title} className="flex min-h-full flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {isSignedIn ? (
        <>
          <CardOnboardingWidget onTopUp={onTopUp} onChooseCardType={onChooseCardType} />
          <CardDetails
            cardVisual={cardVisual}
            assets={assets}
            formatters={{ amount: formatters?.transactionAmount }}
            cardSettingsActions={cardSettingsActions}
            onViewRewards={onViewRewards}
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
            onShowMore={onShowMore}
          />
        </>
      ) : (
        <>
          <CardArtwork />

          <CardLogin key={login.oauthConfig.apiUrl} {...login} />
        </>
      )}
      <p
        className={
          isSignedIn ? "body-3 text-center text-muted" : "mt-auto body-3 text-center text-muted"
        }
        data-testid="pay-card-disclaimer"
      >
        {disclaimer}
      </p>
      {isSignedIn && onTopUp ? (
        <div className="sticky bottom-0 mt-auto py-16">
          <CardTopUpButton onTopUp={onTopUp} />
        </div>
      ) : null}
    </section>
  );
}
