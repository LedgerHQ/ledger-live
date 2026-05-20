import React from "react";
import type { DmkError } from "@ledgerhq/live-dmk-mobile";
import { Trans } from "~/context/Locale";
import TranslatedError from "~/components/TranslatedError";
import { InfoState } from "LLM/components/InfoState";

type FinalErrorViewProps = Readonly<{
  error: Error | DmkError | null;
  onCancel: () => void;
  onContactSupport: () => void;
}>;

export function FinalErrorView({ error, onCancel, onContactSupport }: FinalErrorViewProps) {
  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.contactLedgerSupport" />,
        onPress: onContactSupport,
      }}
      secondaryCta={{
        label: <Trans i18nKey="common.close" />,
        onPress: onCancel,
      }}
      testID="device-initializer-final-error"
    />
  );
}
