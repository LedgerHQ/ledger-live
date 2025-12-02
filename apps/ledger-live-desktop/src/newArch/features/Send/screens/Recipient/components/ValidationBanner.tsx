import React, { useCallback } from "react";
import { Banner, Button } from "@ledgerhq/ldls-ui-react";
import { useTranslation } from "react-i18next";
import { RecipientRequired } from "@ledgerhq/errors";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useTranslatedBridgeError } from "../../../hooks/useTranslatedBridgeError";

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
 * banner component to display validation errors, warnings, and sanctioned addresses.
 * Handles all validation banner types in a single reusable component.
 */
export function ValidationBanner(props: ValidationBannerProps) {
  const { t } = useTranslation();
  const handleHelpCenter = useCallback(() => {
    openURL(urls.helpModal.helpCenter);
  }, []);

  // Extract error/warning for bridge validation (undefined for sanctioned type)
  const error = props.type !== "sanctioned" ? props.error ?? props.warning : undefined;
  const translatedError = useTranslatedBridgeError(error);

  // Sanctioned address banner (with a button to open the help center)
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

  // Error or warning banner from bridge
  const { type, variant, excludeRecipientRequired = false } = props;

  if (!error) return null;

  // Exclude RecipientRequired if specified (handled by empty state)
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
