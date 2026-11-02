import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Coins } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import { resolveEmptyStateDescription } from "../../logic/resolveEmptyStateDescription";
import type { AccountEmptyStateProps } from "./types";

export function AccountEmptyState({ fundingActions, testID }: AccountEmptyStateProps) {
  const { t } = useTranslation();
  const description = resolveEmptyStateDescription(fundingActions);

  return (
    <div className="flex flex-col items-center justify-center gap-24 py-24" data-testid={testID}>
      <Spot icon={Coins} size={72} />
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <span className="heading-4-semi-bold text-base">
          {t("accountDetailHero.emptyState.title")}
        </span>
        {description ? (
          <span className="body-2 text-muted">
            {t(`accountDetailHero.emptyState.description.${description}`)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
