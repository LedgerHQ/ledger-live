import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { ReceiveAddressError, ReceiveGateView } from "../ReceiveAddressView.types";

type Props = Readonly<{ error?: ReceiveAddressError; gate?: ReceiveGateView }>;

/** In place of the address when it cannot be shown: the read failed, or the account cannot receive yet. */
export function ReceiveAddressUnavailable({ error, gate }: Props) {
  if (error) {
    return (
      <InfoState
        preset="error"
        size="hug"
        title={error.title}
        description={error.description}
        primaryCta={{
          label: error.retryLabel,
          onPress: error.onRetry,
          testID: "receive-address-retry",
        }}
        testID="receive-address-error"
      />
    );
  }
  if (!gate) return null;
  return (
    <InfoState
      preset="info"
      size="hug"
      title={gate.title}
      description={gate.description}
      primaryCta={
        gate.action && {
          label: gate.action.label,
          onPress: gate.action.onPress,
          testID: "receive-address-gate-action",
        }
      }
      testID={`receive-address-gate-${gate.type}`}
    />
  );
}
