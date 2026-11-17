import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import type { AccountAnalyticsIntroductionViewModel } from "./AccountAnalyticsIntroductionViewModel.types";

export function AccountAnalyticsIntroductionView({
  isVisible,
  title,
  description,
  actionLabel,
  dismissLabel,
  onDismiss,
  onOpenAnalytics,
  testID,
}: AccountAnalyticsIntroductionViewModel) {
  if (!isVisible) return null;

  return (
    <Banner
      appearance="info"
      title={title}
      description={description}
      onClose={onDismiss}
      closeAriaLabel={dismissLabel}
      testID={testID}
      primaryAction={
        <Button appearance="transparent" size="sm" onPress={onOpenAnalytics}>
          {actionLabel}
        </Button>
      }
    />
  );
}
