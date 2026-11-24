import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { SignTransactionIntentComponentLWM } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/componentLWM";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";

type TokenSignatureIntentComponentLWMProps = Readonly<{
  jobState: SignTransactionIntentWithResultJobState | undefined;
  extraProps: SignatureExtraProps;
  onClose: () => void;
}>;

export function TokenSignatureIntentComponentLWM(props: TokenSignatureIntentComponentLWMProps) {
  const { t } = useTranslation();
  const jobState = props.jobState;

  if (jobState?.type !== "error") {
    return (
      <SignTransactionIntentComponentLWM
        jobState={jobState}
        extraProps={props.extraProps}
        onClose={props.onClose}
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
        testID: "xrp-token-sign-retry",
      }}
      secondaryCta={{ label: t("common.close"), onPress: props.onClose }}
      testID="xrp-token-sign-error"
    />
  );
}
