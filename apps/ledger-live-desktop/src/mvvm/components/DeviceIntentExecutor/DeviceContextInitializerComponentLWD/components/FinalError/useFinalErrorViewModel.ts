import { isDmkError, type DmkError } from "@ledgerhq/live-dmk-desktop";
import type { EnsureAppReadyState, FinalStateType } from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type FinalErrorState = Extract<EnsureAppReadyState, { type: FinalStateType.Error }>;

type Params = Readonly<{
  state: FinalErrorState;
  onCancel: () => void;
}>;

export function useFinalErrorViewModel({ state, onCancel }: Params) {
  const { openSupport } = useInitializerActions();

  return {
    error: getTranslatedErrorInput(state.error),
    onCancel,
    onContactSupport: openSupport,
  };
}

function getTranslatedErrorInput(error: unknown): Error | DmkError {
  if (error instanceof Error || isDmkError(error)) {
    return error;
  }

  return new Error("Unknown error");
}
