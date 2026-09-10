import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { CardArtwork, CardDetails, CardNumbers, CardVisual } from "@features/flow-pay-card-details";
import { CardTransactions } from "@features/flow-pay-card-transactions";
import { CardOnboardingWidget } from "@features/flow-pay-card-widget";
import type { CardViewProps } from "./Card.types";

export function CardView({ title, login, displayState, cardVisual, formatters, unlock }: CardViewProps) {
  const cardFace = cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />;

  return (
    <div className="flex flex-col gap-16">
      <p className="heading-5-semi-bold text-base">{title}</p>
      {displayState === "signedIn" ? (
        <>
          <CardOnboardingWidget />
          {unlock ? (
            <CardNumbers unlock={unlock} cardFace={cardFace} />
          ) : (
            <CardDetails cardVisual={cardVisual} />
          )}
          <CardTransactions
            formatters={{
              amount: formatters?.transactionAmount,
              date: formatters?.transactionDate,
            }}
          />
        </>
      ) : (
        <>
          <CardArtwork />

          <CardLogin key={login.oauthConfig.apiUrl} {...login} />
        </>
      )}
    </div>
  );
}
