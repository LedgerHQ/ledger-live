import React from "react";
import { useTranslation } from "react-i18next";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignedOperation } from "@ledgerhq/types-live";
import { InfoState } from "@shared/ui-info-state";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { SignatureBroadcastPending } from "LLD/features/Send/screens/Signature/components/SignatureBroadcastPending";
import type { SignatureExtraProps } from "LLD/features/Send/screens/Signature/intents/signTransactionIntent/types";
import TranslatedError from "~/renderer/components/TranslatedError";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { StepScreen } from "../StepScreen";
import type { SignatureStepsViewModel } from "./useSignatureSteps";

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

type Props = Readonly<{
  signature: SignatureStepsViewModel;
  successTitle: string;
  successDescription?: string;
  hideViewDetails?: boolean;
  errorTitle?: string;
  onClose: () => void;
}>;

function getErrorContent(
  failure: NonNullable<SignatureStepsViewModel["failure"]>,
  broadcastError: string,
  errorTitle?: string,
) {
  const errorMessage = <TranslatedError error={failure.error} field="title" />;

  if (errorTitle) {
    return {
      title: errorTitle,
      description: errorMessage,
      banner: failure.isSigned
        ? {
            appearance: "warning" as const,
            description: broadcastError,
            testID: "xrp-signature-broadcast-error",
          }
        : undefined,
    };
  }

  return {
    title: errorMessage,
    description: failure.isSigned ? (
      broadcastError
    ) : (
      <TranslatedError error={failure.error} field="description" />
    ),
  };
}

export function SignatureSteps({
  signature,
  successTitle,
  successDescription,
  hideViewDetails,
  errorTitle,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { phase, executorInput, failure, operation } = signature;

  if (phase === "sign") {
    if (!executorInput) return null;

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
        deviceInitializationInput={executorInput.deviceInitializationInput}
        intent={executorInput.intent}
        intentComponentExtraProps={signature.extraProps}
        onIntentJobComplete={signature.onIntentJobComplete}
        onExecutorStateChanged={signature.onExecutorStateChanged}
        cancelIntentRequestId={undefined}
        onUserCancel={signature.onReset}
      />
    );
  }

  if (phase === "broadcasting") {
    return (
      <StepScreen onClose={onClose}>
        <SignatureBroadcastPending />
      </StepScreen>
    );
  }

  if (phase === "success" && operation) {
    const onViewDetails = () => {
      onClose();
      setDrawer(OperationDetails, { operationId: operation.id, accountId: operation.accountId });
    };

    return (
      <StepScreen onClose={onClose}>
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={operation.accountId}
        />
        <InfoState
          preset="success"
          size="hug"
          testID="xrp-signature-success"
          title={successTitle}
          description={successDescription}
          primaryCta={{ label: t("xrp.manageAssets.editAsset.gotIt"), onPress: onClose }}
          secondaryCta={
            hideViewDetails
              ? undefined
              : {
                  label: t("xrp.addToken.steps.confirmation.success.cta"),
                  onPress: onViewDetails,
                  testID: "xrp-signature-view-details",
                }
          }
        />
      </StepScreen>
    );
  }

  if (phase === "error" && failure) {
    const broadcastError = t("xrp.addToken.steps.confirmation.broadcastError");

    return (
      <StepScreen onClose={onClose}>
        <InfoState
          preset="error"
          size="hug"
          testID="xrp-signature-error"
          {...getErrorContent(failure, broadcastError, errorTitle)}
          primaryCta={{
            label: t("common.tryAgain"),
            onPress: signature.onReset,
            testID: "xrp-signature-retry",
          }}
          secondaryCta={{
            label: t("common.close"),
            onPress: onClose,
            testID: "xrp-signature-close",
          }}
        />
      </StepScreen>
    );
  }

  return null;
}
