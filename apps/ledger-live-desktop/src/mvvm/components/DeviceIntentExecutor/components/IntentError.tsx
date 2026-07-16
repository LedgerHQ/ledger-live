import React from "react";
import { useTranslation } from "react-i18next";
import type { ErrorComponent } from "@ledgerhq/device-intent";
import { isDmkError } from "@ledgerhq/live-dmk-desktop";
import TranslatedError from "~/renderer/components/TranslatedError";
import { InfoState } from "LLD/components/InfoState";

const devBanner = __DEV__
  ? ({
      title: "Developer note",
      description:
        "The current intent let an error escape its job observable. " +
        "Handle errors inside the intent's job so this generic fallback is not shown.",
      appearance: "warning",
    } as const)
  : undefined;

export const IntentError: ErrorComponent = ({ onRetry, onClose, error }) => {
  const { t } = useTranslation();
  const errorIsTranslatable = error && (isDmkError(error) || error instanceof Error);
  const translatedError = error as Error;

  return (
    <InfoState
      preset="error"
      size="hug"
      title={
        errorIsTranslatable ? (
          <TranslatedError error={translatedError} field="title" />
        ) : (
          t("deviceIntentExecutor.errors.intentError.title")
        )
      }
      description={
        errorIsTranslatable ? (
          <TranslatedError error={translatedError} field="description" />
        ) : (
          t("deviceIntentExecutor.errors.intentError.description")
        )
      }
      banner={devBanner}
      primaryCta={{
        label: t("common.retry"),
        onPress: onRetry,
      }}
      secondaryCta={{
        label: t("common.close"),
        onPress: onClose,
      }}
      testID="device-intent-executor-intent-error"
    />
  );
};
