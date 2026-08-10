import React from "react";
import { useTranslation } from "react-i18next";
import type { DmkError } from "@ledgerhq/live-dmk-desktop";
import { InfoState } from "LLD/components/InfoState";
import TranslatedError from "~/renderer/components/TranslatedError";

type FinalErrorViewProps = Readonly<{
  error: Error | DmkError;
  onCancel: () => void;
  onContactSupport: () => void;
}>;

export function FinalErrorView({ error, onCancel, onContactSupport }: FinalErrorViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.contactLedgerSupport"),
        onPress: onContactSupport,
      }}
      secondaryCta={{
        label: t("common.close"),
        onPress: onCancel,
      }}
      testID="device-initializer-final-error"
    />
  );
}
