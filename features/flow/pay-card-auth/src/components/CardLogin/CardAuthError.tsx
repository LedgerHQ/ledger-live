import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { CardAuthErrorProps } from "./types";

export function CardAuthError({
  icon,
  title,
  description,
  ctaLabel,
  onRetry,
  children,
}: CardAuthErrorProps) {
  return (
    <>
      <InfoState
        preset="spot"
        spotProps={{ icon }}
        size="hug"
        title={title}
        description={description}
        primaryCta={{ label: ctaLabel, onPress: onRetry, testID: "card-auth-error-cta" }}
        testID="card-auth-error"
      />
      {children}
    </>
  );
}
