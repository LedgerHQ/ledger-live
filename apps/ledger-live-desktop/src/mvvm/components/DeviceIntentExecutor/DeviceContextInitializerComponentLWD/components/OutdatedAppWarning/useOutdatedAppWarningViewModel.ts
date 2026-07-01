import { useCallback } from "react";
import type {
  AppInteractionRequiredStateType,
  EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type OutdatedAppWarningState = Extract<
  EnsureAppReadyState,
  { type: AppInteractionRequiredStateType.OutdatedAppWarning }
>;

type Params = Readonly<{
  state: OutdatedAppWarningState;
}>;

export function useOutdatedAppWarningViewModel({ state }: Params) {
  const { openMyLedger } = useInitializerActions();

  const onOpenMyLedger = useCallback(() => {
    openMyLedger(state.appName);
  }, [openMyLedger, state.appName]);

  return {
    appName: state.appName,
    onOpenMyLedger,
    onContinue: state.onContinue,
  };
}
