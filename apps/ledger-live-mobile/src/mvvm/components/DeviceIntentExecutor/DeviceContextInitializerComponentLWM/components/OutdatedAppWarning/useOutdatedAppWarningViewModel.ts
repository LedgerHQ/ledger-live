import { useCallback } from "react";
import type {
  EnsureAppReadyState,
  AppInteractionRequiredStateType,
} from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type OutdatedAppWarningState = Extract<
  EnsureAppReadyState,
  { type: AppInteractionRequiredStateType.OutdatedAppWarning }
>;

type Params = Readonly<{
  state: OutdatedAppWarningState;
  device: InitializerDevice;
}>;

export function useOutdatedAppWarningViewModel({ state, device }: Params) {
  const { openMyLedger } = useInitializerActions(device);
  const onOpenMyLedger = useCallback(
    () => openMyLedger(state.appName),
    [openMyLedger, state.appName],
  );

  return {
    appName: state.appName,
    onOpenMyLedger,
    onContinue: state.onContinue,
  };
}
