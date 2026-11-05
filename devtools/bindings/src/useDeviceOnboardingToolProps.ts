import { useMemo } from "react";
import type { DevToolsConfig } from "@devtools/registry";
import type { DeviceOnboardingToolState } from "./useDeviceOnboardingToolState";

type DeviceOnboardingToolProps = Extract<
  DevToolsConfig[number],
  { id: "device-onboarding" }
>["config"];

type FeatureFlagControls = Pick<
  DeviceOnboardingToolProps,
  "featureFlag" | "setFeatureFlag" | "isFeatureFlagOverridden" | "resetFeatureFlag"
>;

export type UseDeviceOnboardingToolPropsInput = {
  /** The host's product session: what the funnel itself reads. */
  session: Pick<
    DeviceOnboardingToolProps,
    | "status"
    | "device"
    | "state"
    | "context"
    | "exit"
    | "sendableEvents"
    | "error"
    | "connect"
    | "send"
    | "reset"
  >;
  toolState: Pick<DeviceOnboardingToolState, "log" | "machineContext" | "nextStates">;
  /** A host without the `deviceOnboarding` flag leaves it out, and the tool hides its switches. */
  featureFlag?: FeatureFlagControls;
};

export function useDeviceOnboardingToolProps({
  session,
  toolState,
  featureFlag,
}: UseDeviceOnboardingToolPropsInput): DeviceOnboardingToolProps {
  const { status, device, state, context, exit, sendableEvents, error, connect, send, reset } =
    session;
  const { log, machineContext, nextStates } = toolState;

  return useMemo(
    () => ({
      status,
      device,
      state,
      context,
      machineContext,
      log,
      exit,
      sendableEvents,
      nextStates,
      error,
      connect,
      send,
      reset,
      ...featureFlag,
    }),
    [
      status,
      device,
      state,
      context,
      machineContext,
      log,
      exit,
      sendableEvents,
      nextStates,
      error,
      connect,
      send,
      reset,
      featureFlag,
    ],
  );
}
