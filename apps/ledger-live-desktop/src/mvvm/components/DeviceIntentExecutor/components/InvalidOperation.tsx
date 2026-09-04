import React from "react";
import { useTranslation } from "react-i18next";
import type { InvalidOperationComponent } from "@features/platform-device-intent";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "./TrackDIEScreen";
import {
  DEVICE_ACTION_BUTTON,
  PAGE_DEVICE_ACTION,
  trackDeviceActionButtonClicked,
} from "../utils/trackDeviceIntent";

const devBanner = __DEV__
  ? ({
      title: "Developer note",
      description:
        "The DeviceIntentExecutor entered an invalid state. This signals a mistake " +
        "in how the executor is integrated by the caller (e.g. swapping intents while " +
        "one is still running).",
      appearance: "warning",
    } as const)
  : undefined;

export const InvalidOperation: InvalidOperationComponent = ({ onClose }) => {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const handleClose = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onClose();
  };

  return (
    <>
      <TrackDIEScreen category={PAGE_DEVICE_ACTION.InvalidState} refreshSource />
      <InfoState
        preset="error"
        size="hug"
        title={t("deviceIntentExecutor.errors.invalidOperation.title")}
        description={t("deviceIntentExecutor.errors.invalidOperation.description")}
        banner={devBanner}
        primaryCta={{
          label: t("common.close"),
          onPress: handleClose,
        }}
        testID="device-intent-executor-invalid-operation"
      />
    </>
  );
};
