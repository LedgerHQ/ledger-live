import React, { useCallback } from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { RecipientRequired } from "@ledgerhq/errors";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { useTranslatedBridgeError } from "../hooks/useTranslatedBridgeError";

type ValidationBannerProps =
  | Readonly<{
      type: "error" | "warning";
      error?: Error;
      warning?: Error;
      variant: "recipient" | "sender";
      excludeRecipientRequired?: boolean;
    }>
  | Readonly<{
      type: "sanctioned";
    }>;

/**
 * Banner component to display validation errors, warnings, and sanctioned addresses.
 * Handles all validation banner types in a single reusable component.
 */
export function ValidationBanner(props: ValidationBannerProps) {
  const { t } = useTranslation();
  const helpCenterUrl = useLocalizedUrl(urls.helpModal.helpCenter);
  const handleHelpCenter = useCallback(() => {
    openURL(helpCenterUrl);
  }, [helpCenterUrl]);

  const error = props.type === "sanctioned" ? undefined : props.error ?? props.warning;
  const translatedError = useTranslatedBridgeError(error);

  if (props.type === "sanctioned") {
    return (
      <Banner
        appearance="error"
        title="Flagged address"
        description={t("newSendFlow.sanctioned.description")}
        primaryAction={
          <Button appearance="transparent" size="sm" onClick={handleHelpCenter}>
            {t("newSendFlow.sanctioned.helpCenter")}
          </Button>
        }
        data-testid="sanctioned-address-banner"
      />
    );
  }

  const { type, variant, excludeRecipientRequired = false } = props;

  if (!error) return null;

  if (excludeRecipientRequired && error instanceof RecipientRequired) return null;

  if (!translatedError) return null;

  const dataTestId = `${variant}-${type}-banner`;

  return (
    <Banner
      appearance={type}
      title={translatedError.title}
      description={translatedError.description}
      data-testid={dataTestId}
    />
  );
}
