import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Coins } from "@ledgerhq/lumen-ui-rnative/symbols";
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
    <Box lx={{ alignItems: "center", gap: "s24" }} testID={testId}>
      {variant === "error" ? (
        <Spot appearance="error" size={72} />
      ) : (
        <Spot appearance="icon" icon={Coins} size={72} />
      )}
      <Box lx={{ alignItems: "center", gap: "s4" }}>
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t(`${KEY_PREFIX}.${variant}.title`)}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {t(`${KEY_PREFIX}.${variant}.description`)}
        </Text>
      </Box>
      {onPress ? (
        <Button appearance="base" size="md" onPress={onPress} testID={`${testId}-cta`}>
          {t(`${KEY_PREFIX}.${variant}.cta`)}
        </Button>
      ) : null}
    </Box>
  );
}
