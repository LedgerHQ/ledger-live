import React from "react";
import { useTranslation } from "react-i18next";
import type { ErrorComponent } from "@features/platform-device-intent";
import { isDmkError } from "@ledgerhq/live-dmk-desktop";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import TranslatedError from "~/renderer/components/TranslatedError";
import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "./TrackDIEScreen";
import {
  DEVICE_ACTION_BUTTON,
  getConnectedDeviceTrackingProperties,
  PAGE_DEVICE_ACTION,
  trackDeviceActionButtonClicked,
} from "../utils/trackDeviceIntent";

const devBanner = __DEV__
  ? ({
      title: "Developer note",
      description:
        "The current intent let an error escape its job observable. " +
        "Handle errors inside the intent's job so this generic fallback is not shown.",
      appearance: "warning",
    } as const)
  : undefined;

export const IntentError: ErrorComponent = ({ device, onRetry, onClose, error }) => {
  const { t } = useTranslation();
  const errorIsTranslatable = error && (isDmkError(error) || error instanceof Error);
  const translatedError = error as Error;
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { modelId, transport } = getConnectedDeviceTrackingProperties(device);
  const handleRetry = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Retry,
      modelId,
      transport,
      extraProperties: analyticsProperties,
    });
    onRetry();
  };
  const handleClose = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Close,
      modelId,
      transport,
      extraProperties: analyticsProperties,
    });
    onClose();
  };

  return (
    <>
      <TrackDIEScreen
        category={PAGE_DEVICE_ACTION.UnknownIntentError}
        modelId={modelId}
        transport={transport}
        refreshSource
      />
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
          onPress: handleRetry,
        }}
        secondaryCta={{
          label: t("common.close"),
          onPress: handleClose,
        }}
        testID="device-intent-executor-intent-error"
      />
    </>
  );
};
