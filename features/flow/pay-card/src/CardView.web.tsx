import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import {
  CardArtwork,
  CardDetails,
  CardLoadingVisual,
  CardPrimaryActionButton,
} from "@features/flow-pay-card-details";
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
  primaryAction,
  cardState,
  onViewRewards,
  cardSettingsActions,
}: CardViewProps) {
  const isSignedIn = displayState === "signedIn";
  const hasCard = cardState === "ready";

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
            cardState={cardState}
          />
          {hasCard && assets ? (
            <div className="mt-8">
              <CardAssets {...assets} />
            </div>
          ) : null}
          {hasCard ? (
            <CardTransactions
              formatters={{
                amount: formatters?.transactionAmount,
                date: formatters?.transactionDate,
              }}
              onShowMore={onShowMore}
            />
          ) : null}
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
      <p
        className={
          isSignedIn ? "body-3 text-center text-muted" : "mt-auto body-3 text-center text-muted"
        }
        data-testid="pay-card-disclaimer"
      >
        {disclaimer}
      </p>
      {isSignedIn && primaryAction ? (
        <div className="sticky bottom-0 mt-auto py-16">
          <CardPrimaryActionButton {...primaryAction} />
        </div>
      ) : null}
    </section>
  );
}
