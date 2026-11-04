import { useCallback, useLayoutEffect, useRef } from "react";
import type { DevToolsConfig } from "@devtools/shell";
import { useDeviceOnboardingToolProps, useDeviceOnboardingToolState } from "@devtools/bindings";
import type { OnboardingInspectionEvent } from "@features/platform-device-onboarding";
import { useDeviceOnboarding } from "../../DeviceOnboarding/hooks/useDeviceOnboarding";
import { useDeviceOnboardingFeatureFlag } from "./useDeviceOnboardingFeatureFlag";

type DeviceOnboardingToolProps = Extract<
  DevToolsConfig[number],
  { id: "device-onboarding" }
>["config"];

type UseDeviceOnboardingInput = Omit<Parameters<typeof useDeviceOnboarding>[0], "inspect">;

/** The product session, watched by the devtool from the actor's creation. */
export function useDeviceOnboardingToolSession(input: UseDeviceOnboardingInput) {
  // The tool state reads the session's refs, and the session needs the tool state's observer:
  // a stable forwarder breaks the cycle. The actor is only created after a render.
  const inspectRef = useRef<(event: OnboardingInspectionEvent) => void>(() => undefined);
  const inspect = useCallback((event: OnboardingInspectionEvent) => inspectRef.current(event), []);
  const session = useDeviceOnboarding({ ...input, inspect });
  const toolState = useDeviceOnboardingToolState({
    snapshot: session.snapshot,
    portsRef: session.portsRef,
  });
  useLayoutEffect(() => {
    inspectRef.current = toolState.inspect;
  }, [toolState.inspect]);
  return { session, toolState };
}

export function useDeviceOnboardingTool(
  input: UseDeviceOnboardingInput,
): DeviceOnboardingToolProps {
  const { session, toolState } = useDeviceOnboardingToolSession(input);
  const featureFlag = useDeviceOnboardingFeatureFlag();
  return useDeviceOnboardingToolProps({ session, toolState, featureFlag });
}
