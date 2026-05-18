import { isDmkError, type DmkError } from "@ledgerhq/live-dmk-mobile";
import type { FinalStateType, EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type FinalErrorState = Extract<EnsureAppReadyState, { type: FinalStateType.Error }>;

type Params = Readonly<{
  state: FinalErrorState;
  device: InitializerDevice;
  onCancel: () => void;
}>;

export function useFinalErrorViewModel({ state, device, onCancel }: Params) {
  const { openSupport } = useInitializerActions(device);

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
