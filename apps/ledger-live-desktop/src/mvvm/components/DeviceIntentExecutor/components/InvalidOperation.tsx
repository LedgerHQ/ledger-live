import React from "react";
import { useTranslation } from "react-i18next";
import type { InvalidOperationComponent } from "@ledgerhq/device-intent";
import { InfoState } from "LLD/components/InfoState";

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

  return (
    <InfoState
      preset="error"
      size="hug"
      title={t("deviceIntentExecutor.errors.invalidOperation.title")}
      description={t("deviceIntentExecutor.errors.invalidOperation.description")}
      banner={devBanner}
      primaryCta={{
        label: t("common.close"),
        onPress: onClose,
      }}
      testID="device-intent-executor-invalid-operation"
    />
  );
};
