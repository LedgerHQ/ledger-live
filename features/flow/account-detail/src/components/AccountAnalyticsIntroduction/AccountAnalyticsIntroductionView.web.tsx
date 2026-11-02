import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import type { AccountAnalyticsIntroductionViewModel } from "./types";

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
      data-testid={testID}
      primaryAction={
        <Button appearance="transparent" size="sm" onClick={onOpenAnalytics}>
          {actionLabel}
        </Button>
      }
    />
  );
}
