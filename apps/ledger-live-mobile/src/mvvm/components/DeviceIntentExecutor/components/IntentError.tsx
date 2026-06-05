import React from "react";
import type { ErrorComponent } from "@ledgerhq/device-intent";
import { isDmkError } from "@ledgerhq/live-dmk-mobile/errors";
import { Trans } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import TranslatedError from "~/components/TranslatedError";
import { InfoState } from "LLM/components/InfoState";
import { useSourceFlow } from "../utils/SourceFlowContext";
import {
  DEVICE_ACTION_BUTTON,
  getConnectedDeviceTrackingProperties,
  PAGE_DEVICE_ACTION,
  trackDeviceActionButtonClicked,
} from "../utils/trackDeviceIntent";

// Dev-only hint surfaced in the banner slot. This screen means the running intent let
// an error escape its job observable, which is an implementation mistake that should
// be handled inside the intent itself.
const devBanner = __DEV__
  ? ({
      title: "Developer note",
      description:
        "The current intent let an error escape its job observable. " +
        "Handle errors inside the intent's job so this generic fallback is not shown.",
      appearance: "warning",
    } as const)
  : undefined;

/**
 * Generic error displayed when the intent observable emits an uncaught error.
 *
 * Intents are expected to handle their own errors internally; this component is the
 * last-resort fallback used by the executor when that does not happen.
 */
export const IntentError: ErrorComponent = ({ device, onRetry, onClose, error }) => {
  const errorIsTranslatable = error && (isDmkError(error) || error instanceof Error);
  const sourceFlow = useSourceFlow();
  const { modelId, transport } = getConnectedDeviceTrackingProperties(device);
  const handleRetry = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Retry,
      modelId,
      transport,
    });
    onRetry();
  };
  const handleClose = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Close,
      modelId,
      transport,
    });
    onClose();
  };

  return (
    <>
      <TrackScreen
        category={PAGE_DEVICE_ACTION.UnknownIntentError}
        sourceFlow={sourceFlow}
        modelId={modelId}
        transport={transport}
        refreshSource
        deviceUxV2
      />
      <InfoState
        preset="error"
        size="hug"
        title={
          errorIsTranslatable ? (
            <TranslatedError error={error} field="title" />
          ) : (
            <Trans i18nKey="deviceIntentExecutor.errors.intentError.title" />
          )
        }
        description={
          errorIsTranslatable ? (
            <TranslatedError error={error} field="description" />
          ) : (
            <Trans i18nKey="deviceIntentExecutor.errors.intentError.description" />
          )
        }
        banner={devBanner}
        primaryCta={{
          label: <Trans i18nKey="common.retry" />,
          onPress: handleRetry,
        }}
        secondaryCta={{
          label: <Trans i18nKey="common.close" />,
          onPress: handleClose,
        }}
        testID="device-intent-executor-intent-error"
      />
    </>
  );
};
