import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { SignTransactionIntentComponentLWM } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/componentLWM";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";

type DeleteTokenIntentComponentLWMProps = Readonly<{
  jobState: SignTransactionIntentWithResultJobState | undefined;
  extraProps: SignatureExtraProps;
  onClose: () => void;
}>;

export function DeleteTokenIntentComponentLWM({
  jobState,
  extraProps,
  onClose,
}: DeleteTokenIntentComponentLWMProps) {
  const { t } = useTranslation();

  if (jobState?.type !== "error") {
    return (
      <SignTransactionIntentComponentLWM
        jobState={jobState}
        extraProps={extraProps}
        onClose={onClose}
      />
    );
  }

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={jobState.error} field="title" />}
      description={<TranslatedError error={jobState.error} field="description" />}
      primaryCta={{
        label: t("common.retry"),
        onPress: jobState.retry,
        testID: "xrp-delete-token-sign-retry",
      }}
      secondaryCta={{ label: t("common.close"), onPress: onClose }}
      testID="xrp-delete-token-sign-error"
    />
  );
}
