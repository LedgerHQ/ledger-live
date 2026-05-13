import { FinalStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../types";

type SuccessStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: FinalStateType.Success }>
>;

export function SuccessState(_: SuccessStateProps) {
  return null;
}
