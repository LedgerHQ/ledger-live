import React from "react";
import { Trans } from "react-i18next";
import { isAxiosError } from "axios";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";

/**
 * Formats Concordium onboarding errors into user-friendly translated messages.
 *
 * @param error - The error to format
 * @param context - The context where the error occurred ("onboard" or "create")
 * @returns A React element with the translated error message
 */
export function formatOnboardingError(
  error: Error | null,
  context: "onboard" | "create",
): React.ReactElement {
  // Handle device-related errors (common to both contexts)
  if (error instanceof UserRefusedOnDevice || error instanceof LockedDeviceError) {
    return <Trans i18nKey={error.message} />;
  }

  // Handle 429 rate limit errors (specific to create context)
  if (context === "create" && isAxiosError(error) && error.status === 429) {
    return <Trans i18nKey="families.concordium.addAccount.create.error429" />;
  }

  // Default error messages based on context
  const defaultErrorKey =
    context === "onboard"
      ? "families.concordium.addAccount.identity.error"
      : "families.concordium.addAccount.create.error";

  return <Trans i18nKey={defaultErrorKey} />;
}
