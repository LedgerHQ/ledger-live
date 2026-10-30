import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { AccountStatusBannerProps } from "./AccountStatusBanner.types";

export function AccountStatusBanner({
  title,
  description,
  action,
  onAction,
  testID,
}: AccountStatusBannerProps) {
  const { t } = useTranslation();

  return (
    <Banner
      appearance="info"
      title={title}
      description={description}
      className="[&_.line-clamp-5]:line-clamp-none"
      primaryAction={
        action && onAction ? (
          <Button
            appearance="gray"
            size="sm"
            icon={action === "learnMore" ? ExternalLink : undefined}
            onClick={onAction}
            data-testid={testID ? `${testID}-action` : undefined}
          >
            {t(`accountDetailNotices.actions.${action}`)}
          </Button>
        ) : undefined
      }
      data-testid={testID}
    />
  );
}
