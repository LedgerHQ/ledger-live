import React from "react";
import type { InvalidOperationComponent } from "@ledgerhq/device-intent";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

// Dev-only hint surfaced in the banner slot. This screen means the caller drove the
// executor into an invalid state (e.g. swapping intents while one is still running),
// which is an integration mistake that should be fixed upstream.
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

/**
 * Generic error displayed when the executor enters the terminal `invalidOperation`
 * state, signalling a caller-side orchestration bug. Not expected in production.
 */
export const InvalidOperation: InvalidOperationComponent = ({ onClose }) => (
  <InfoState
    preset="error"
    size="hug"
    title={<Trans i18nKey="deviceIntentExecutor.errors.invalidOperation.title" />}
    description={<Trans i18nKey="deviceIntentExecutor.errors.invalidOperation.description" />}
    banner={devBanner}
    primaryCta={{
      label: <Trans i18nKey="common.close" />,
      onPress: onClose,
    }}
    testID="device-intent-executor-invalid-operation"
  />
);
