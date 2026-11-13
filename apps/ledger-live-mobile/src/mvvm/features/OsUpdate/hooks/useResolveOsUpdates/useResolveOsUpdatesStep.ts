import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { ResolveOsUpdatePathUseCase, type OsUpdate } from "@ledgerhq/live-dmk-shared";
import type { ResolveOsUpdates } from "@ledgerhq/live-common/intents/openMyLedgerIntent";
import { useDispatch } from "~/context/hooks";
import { isOsUpdateSupported } from "../../utils/isOsUpdateSupported";
import { setHasBackup, setOsUpdates } from "../../state/osUpdateSlice";
import { hasStoredBackup } from "./index";

/**
 * Same as `useResolveOsUpdates`, as a step that a device intent runs on its own session.
 * Undefined when the `ldmkOsUpdates` feature flag is disabled.
 */
export function useResolveOsUpdatesStep(): ResolveOsUpdates | undefined {
  const enabled = useFeature("ldmkOsUpdates")?.enabled ?? false;
  const dispatch = useDispatch();

  return useMemo(() => {
    if (!enabled) return undefined;

    return async ({ deviceConnectionResult: { dmk, sessionId }, device, deviceInfo }) => {
      const { modelId, wired } = device;
      const canResolve =
        !deviceInfo.isBootloader &&
        isOsUpdateSupported({ modelId, version: deviceInfo.version, wired });
      const resolving: Promise<OsUpdate[]> = canResolve
        ? new ResolveOsUpdatePathUseCase().execute({ dmk, sessionId }).catch(() => [])
        : Promise.resolve([]);
      const [osUpdates, hasBackup] = await Promise.all([resolving, hasStoredBackup(modelId)]);
      dispatch(setOsUpdates(osUpdates));
      dispatch(setHasBackup(hasBackup));
    };
  }, [enabled, dispatch]);
}
