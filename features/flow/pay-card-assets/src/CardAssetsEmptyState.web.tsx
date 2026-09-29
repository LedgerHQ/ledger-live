import React from "react";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import { Coins } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";

type CardAssetsEmptyStateProps = Readonly<{
  variant: "error" | "empty";
  onRetry: () => void;
  onAddAsset?: () => void;
}>;

const KEY_PREFIX = "payTab.card.assets";

export function CardAssetsEmptyState({ variant, onRetry, onAddAsset }: CardAssetsEmptyStateProps) {
  const { t } = useTranslation();
  const onPress = variant === "error" ? onRetry : onAddAsset;
  const testId = variant === "error" ? "card-assets-error-state" : "card-assets-empty-state";

  return (
    <div className="flex flex-col items-center gap-24" data-testid={testId}>
      {variant === "error" ? (
        <Spot appearance="error" size={72} />
      ) : (
        <Spot appearance="icon" icon={Coins} size={72} />
      )}
      <div className="flex flex-col items-center gap-8 text-center">
        <span className="heading-4-semi-bold text-base">{t(`${KEY_PREFIX}.${variant}.title`)}</span>
        <span className="body-2 text-muted">{t(`${KEY_PREFIX}.${variant}.description`)}</span>
      </div>
      {onPress ? (
        <Button appearance="base" size="md" onClick={onPress} data-testid={`${testId}-cta`}>
          {t(`${KEY_PREFIX}.${variant}.cta`)}
        </Button>
      ) : null}
    </div>
  );
}
