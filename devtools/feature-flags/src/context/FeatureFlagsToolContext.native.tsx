import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { createSafeContext } from "@ledgerhq/lumen-utils-shared";
import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../types";
import { useFeatureFlagsState } from "../hooks";

export interface FeatureFlagsToolContextState {
  readonly overrides: FeatureFlagsToolProps["overrides"];
  readonly resolved: FeatureFlagsToolProps["resolved"];
  readonly getFlagDisplayState: (id: FeatureId) => FlagDisplayState;
}

export interface FeatureFlagsToolContextActions {
  setOverride: FeatureFlagsToolProps["setOverride"];
  setAllOverrides: FeatureFlagsToolProps["setAllOverrides"];
  clearOverride: FeatureFlagsToolProps["clearOverride"];
  clearAllOverrides: FeatureFlagsToolProps["clearAllOverrides"];
}

const [ActionsProvider, useActions] =
  createSafeContext<FeatureFlagsToolContextActions>("FeatureFlagsToolActions");
const [StateProvider, useState] =
  createSafeContext<FeatureFlagsToolContextState>("FeatureFlagsToolState");

export function FeatureFlagsToolProvider({
  children,
  ...props
}: PropsWithChildren<FeatureFlagsToolProps>) {
  const { getFlagDisplayState } = useFeatureFlagsState(props);
  const { overrides, resolved, setOverride, setAllOverrides, clearOverride, clearAllOverrides } =
    props;
  const actions = useMemo(
    () => ({
      setOverride,
      setAllOverrides,
      clearOverride,
      clearAllOverrides,
    }),
    [setOverride, setAllOverrides, clearOverride, clearAllOverrides],
  );

  const state = useMemo(
    () => ({
      overrides,
      resolved,
      getFlagDisplayState,
    }),
    [overrides, resolved, getFlagDisplayState],
  );

  return (
    <ActionsProvider value={actions}>
      <StateProvider value={state}>{children}</StateProvider>
    </ActionsProvider>
  );
}

export function useFeatureFlagsToolActions(): FeatureFlagsToolContextActions {
  return useActions({ consumerName: "useFeatureFlagsToolActions", contextRequired: true });
}

export function useFeatureFlagsToolState(): FeatureFlagsToolContextState {
  return useState({ consumerName: "useFeatureFlagsToolState", contextRequired: true });
}
