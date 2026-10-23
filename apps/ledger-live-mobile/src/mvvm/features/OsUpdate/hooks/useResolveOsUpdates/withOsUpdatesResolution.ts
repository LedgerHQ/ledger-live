import { useFeature } from "@features/platform-feature-flags";
import type {
  ManagerRequest,
  ManagerState,
  Result,
} from "@ledgerhq/live-common/hw/actions/manager";
import type { Action } from "@ledgerhq/live-common/hw/actions/types";
import { useResolveOsUpdates } from "./index";

type ManagerAction = Action<ManagerRequest, ManagerState, Result>;

/**
 * Keeps the manager action in its loading state until the OS update path is resolved, so the
 * connect bottom sheet only emits its result once the `osUpdate` slice is up to date.
 * Does nothing when the `ldmkOsUpdates` feature flag is disabled.
 */
export function withOsUpdatesResolution(action: ManagerAction): ManagerAction {
  return {
    mapResult: action.mapResult,
    useHook: (device, request) => {
      const state = action.useHook(device, request);
      const enabled = useFeature("ldmkOsUpdates")?.enabled ?? false;

      const isResolvingOsUpdates = useResolveOsUpdates({
        enabled,
        ready: !state.isLoading && !state.error && !state.isLocked && !!state.deviceInfo,
        device: state.device,
        deviceInfo: state.deviceInfo,
      });

      return isResolvingOsUpdates ? { ...state, isLoading: true } : state;
    },
  };
}
