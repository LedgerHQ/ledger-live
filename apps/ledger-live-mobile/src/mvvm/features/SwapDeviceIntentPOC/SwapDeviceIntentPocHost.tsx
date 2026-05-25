import React, { useCallback } from "react";
import { DeviceIntentExecutor } from "@ledgerhq/device-intent";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { LWM_EXECUTOR_PLATFORM_CONFIG } from "LLM/components/DeviceIntentExecutor";
import { InfoState } from "LLM/components/InfoState";
import type { SwapDeviceIntentPocOrchestrationResult } from "./useSwapDeviceIntentPocOrchestration";

type Props = Pick<
  SwapDeviceIntentPocOrchestrationResult,
  "executorProps" | "successScreen" | "enabled" | "onUserCancel"
>;

/**
 * Mounts the swap-POC drawer alongside the swap webview.
 *
 * The drawer is owned by this host (not by `DeviceIntentExecutorLWM`) so it
 * stays mounted across the whole flow: sign-approval -> broadcast-approval
 * -> done. Switching phases only swaps the drawer's inner content, which
 * avoids triggering `QueuedDrawerBottomSheet`'s unmount cleanup -> onClose
 * -> orchestration cancel-and-reject path. That path was the original
 * reason the success sheet flashed shut as soon as the broadcast confirmed.
 *
 * Renders nothing while idle so the bottom sheet only appears when the
 * live app actually requests an approval flow.
 */
export function SwapDeviceIntentPocHost({
  executorProps,
  successScreen,
  enabled,
  onUserCancel,
}: Props): React.ReactElement | null {
  const { bottom: bottomInset } = useSafeAreaInsets();

  // The drawer's onClose fires on user dismiss (X / backdrop) AND on the
  // host unmount cleanup. We dispatch to the most specific handler
  // available so the success-phase resolution path wins over a generic
  // CANCEL when both could match during the inter-phase re-render frame.
  // During `buildSwap` neither executor nor success-screen is mounted, so
  // we fall back to the orchestration's top-level `onUserCancel`.
  const onCloseDuringExecutor = executorProps?.onUserCancel;
  const onCloseDuringSuccess = successScreen?.onClose;
  const handleClose = useCallback(() => {
    if (onCloseDuringSuccess) {
      onCloseDuringSuccess();
    } else if (onCloseDuringExecutor) {
      onCloseDuringExecutor();
    } else {
      onUserCancel();
    }
  }, [onCloseDuringExecutor, onCloseDuringSuccess, onUserCancel]);

  if (!enabled) return null;

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened
      onClose={handleClose}
      preventBackdropClick={executorProps ? !executorProps.cancellableUI : false}
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
        {successScreen ? (
          <>
            <BottomSheetHeader density="expanded" />
            {successScreen.kind === "approval" ? (
              <InfoState
                preset="success"
                title="Token approved"
                description={
                  successScreen.nextStep === "permit"
                    ? "Sign the permit on your device to authorize the swap"
                    : "You can now initiate your swap"
                }
                primaryCta={{
                  label: successScreen.nextStep === "permit" ? "Sign permit" : "Swap",
                  onPress: successScreen.onPrimaryPress,
                }}
                size="hug"
              />
            ) : (
              <InfoState
                preset="success"
                title="Swap completed"
                description="Your swap transaction was confirmed on-chain."
                primaryCta={{ label: "Done", onPress: successScreen.onDonePress }}
                size="hug"
              />
            )}
          </>
        ) : executorProps ? (
          <>
            {executorProps.cancellableUI && <BottomSheetHeader density="expanded" />}
            <DeviceIntentExecutor
              {...executorProps}
              platformConfig={LWM_EXECUTOR_PLATFORM_CONFIG}
            />
          </>
        ) : null}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
