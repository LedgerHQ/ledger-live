import React from "react";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import type { SwapDeviceIntentPocOrchestrationResult } from "./useSwapDeviceIntentPocOrchestration";

type Props = Pick<SwapDeviceIntentPocOrchestrationResult, "executorProps" | "enabled">;

/**
 * Mounts the LWM device-intent executor for the swap POC flow.
 *
 * Renders nothing while idle so the bottom sheet only appears when the live
 * app actually requests an approval flow. Designed to be rendered alongside
 * the swap webview (one mount per swap screen).
 */
export function SwapDeviceIntentPocHost({ executorProps, enabled }: Props): React.ReactElement | null {
  if (!enabled || !executorProps) return null;
  return <DeviceIntentExecutorLWM {...executorProps} />;
}
