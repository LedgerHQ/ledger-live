import React from "react";
import { Banner, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
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
      description={
        description ? (
          <Text typography="body2" lx={{ color: "base" }}>
            {description}
          </Text>
        ) : undefined
      }
      primaryAction={
        action && onAction ? (
          <Button
            appearance="gray"
            size="sm"
            icon={action === "learnMore" ? ExternalLink : undefined}
            onPress={onAction}
            testID={testID ? `${testID}-action` : undefined}
          >
            {t(`accountDetailNotices.actions.${action}`)}
          </Button>
        ) : undefined
      }
      testID={testID}
    />
  );
}
