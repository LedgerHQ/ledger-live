import React from "react";
import { Button, Skeleton } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { CardAuthError } from "./CardAuthError";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  headline,
  description,
  loginLabel,
  showAlreadyHaveCard,
  isLoading,
  isResolving,
  error,
  onLoginPress,
  onAlreadyHaveCardPress,
  intro,
}: CardLoginViewProps) {
  const { t } = useTranslation();
  const alreadyHaveCardLabel = t("payTab.cardLogin.beforeIntro.alreadyHaveCard");

  return (
    <>
      {isResolving ? (
        <CardLoginSkeleton />
      ) : (
        <div className="flex flex-col gap-24 text-center">
          <div className="flex flex-col gap-12">
            <h2 className="heading-2-semi-bold text-base">{headline}</h2>
            <p className="body-2 text-muted">{description}</p>
          </div>
          <div className="flex flex-col items-center gap-16">
            <Button
              appearance="base"
              size="md"
              loading={isLoading}
              disabled={isLoading}
              onClick={onLoginPress}
              aria-label={loginLabel}
            >
              {loginLabel}
            </Button>
            {showAlreadyHaveCard ? (
              <Button
                appearance="no-background"
                size="md"
                disabled={isLoading}
                onClick={onAlreadyHaveCardPress}
                aria-label={alreadyHaveCardLabel}
              >
                {alreadyHaveCardLabel}
              </Button>
            ) : null}
          </div>
        </div>
      )}
      <CardAuthError error={error} />
      <CardLoginIntroView {...intro} />
    </>
  );
}

function CardLoginSkeleton() {
  return (
    <div className="flex flex-col items-center gap-16" data-testid="card-login-skeleton">
      <Skeleton className="h-56 w-full rounded-md" />
      <Skeleton className="h-56 w-full rounded-md" />
    </div>
  );
}
