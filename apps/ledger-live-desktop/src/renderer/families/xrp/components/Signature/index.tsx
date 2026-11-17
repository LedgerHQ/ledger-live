import React from "react";
import { useTranslation } from "react-i18next";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignedOperation } from "@ledgerhq/types-live";
import { InfoState } from "@shared/ui-info-state";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { SignatureBroadcastPending } from "LLD/features/Send/screens/Signature/components/SignatureBroadcastPending";
import { SignatureError } from "LLD/features/Send/screens/Signature/components/SignatureError";
import type { SignatureExtraProps } from "LLD/features/Send/screens/Signature/intents/signTransactionIntent/types";
import TranslatedError from "~/renderer/components/TranslatedError";
import { StepScreen } from "../StepScreen";
import type { SignatureStepsViewModel } from "./useSignatureSteps";

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

type Props = Readonly<{
  signature: SignatureStepsViewModel;
  successTitle: string;
  successDescription?: React.ReactNode;
  successCtaLabel?: string;
  errorTitle?: string;
  onClose: () => void;
}>;

export function SignatureSteps({
  signature,
  successTitle,
  successDescription,
  successCtaLabel,
  errorTitle,
  onClose,
}: Props) {
  const { t } = useTranslation();

  switch (signature.phase) {
    case "idle":
      return null;
    case "sign":
      if (
        !signature.request ||
        !signature.deviceInitializationInput ||
        !signature.signatureIntent
      ) {
        return null;
      }

      return (
        <DeviceIntentExecutor<
          SignTransactionIntentWithResultJobState,
          SignatureRequest,
          SignatureExtraProps,
          SignedOperation
        >
          enabled
          sourceFlow="manage_assets"
          deviceConnectionParams={DEVICE_CONNECTION_PARAMS}
          deviceInitializationInput={signature.deviceInitializationInput}
          intent={signature.signatureIntent}
          intentComponentExtraProps={signature.extraProps}
          onIntentJobComplete={signature.onIntentJobComplete}
          onExecutorStateChanged={signature.onExecutorStateChanged}
          cancelIntentRequestId={undefined}
          onUserCancel={signature.onReset}
        />
      );
    case "broadcasting":
      return (
        <StepScreen onClose={onClose}>
          <SignatureBroadcastPending />
        </StepScreen>
      );
    case "success":
      return (
        <StepScreen onClose={onClose}>
          <InfoState
            preset="success"
            size="hug"
            testID="xrp-manage-assets-success"
            title={successTitle}
            description={successDescription}
            primaryCta={{ label: successCtaLabel ?? t("common.close"), onPress: onClose }}
          />
        </StepScreen>
      );
    case "error":
      if (!signature.error) return null;

      if (!errorTitle) {
        return (
          <StepScreen onClose={onClose}>
            <SignatureError error={signature.error} onClose={onClose} onRetry={signature.onReset} />
          </StepScreen>
        );
      }

      return (
        <StepScreen onClose={onClose}>
          <InfoState
            preset="error"
            size="hug"
            testID="xrp-signature-error"
            title={errorTitle}
            description={<TranslatedError error={signature.error} field="title" />}
            primaryCta={{
              label: t("xrp.addTokenDialog.error.tryAgain"),
              onPress: signature.onReset,
              testID: "xrp-signature-error-retry",
            }}
            secondaryCta={{ label: t("common.close"), onPress: onClose }}
          />
        </StepScreen>
      );
  }
}
