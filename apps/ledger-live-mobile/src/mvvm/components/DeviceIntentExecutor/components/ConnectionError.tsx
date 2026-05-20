import React from "react";
import type { ErrorComponent } from "@ledgerhq/device-intent";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

/**
 * Generic error displayed when the device disconnects in the middle of an intent
 * (either during the "connect app" step or during execution).
 */
export const ConnectionError: ErrorComponent = ({ onRetry, onClose }) => (
  <InfoState
    preset="error"
    size="hug"
    title={<Trans i18nKey="deviceIntentExecutor.errors.connectionError.title" />}
    description={<Trans i18nKey="deviceIntentExecutor.errors.connectionError.description" />}
    primaryCta={{
      label: <Trans i18nKey="common.retry" />,
      onPress: onRetry,
    }}
    secondaryCta={{
      label: <Trans i18nKey="common.close" />,
      onPress: onClose,
    }}
    testID="device-intent-executor-connection-error"
  />
);
