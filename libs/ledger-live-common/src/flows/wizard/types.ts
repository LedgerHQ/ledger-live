import type { ComponentType } from "react";

/**
 * Shared types for flow-based wizards
 *
 * These types provide the foundation for flow management.
 * Platform-specific navigation logic (LLD custom navigation, LLM React Navigation)
 * is implemented in the respective applications.
 */

export type FlowStep = string;

export const FLOW_STATUS = {
  IDLE: "IDLE",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
} as const;

export type FlowStatus = (typeof FLOW_STATUS)[keyof typeof FLOW_STATUS];

export type FlowStepConfig<TStep extends FlowStep = FlowStep> = Readonly<{
  id: TStep;
  canGoBack: boolean;
  showHeader?: boolean;
}>;

export type FlowStatusActions = Readonly<{
  setStatus: (status: FlowStatus) => void;
  setError: () => void;
  setSuccess: () => void;
  resetStatus: () => void;
}>;

export type StepRenderer = ComponentType<unknown>;

export type StepRegistry<TStep extends FlowStep = FlowStep> = Partial<Record<TStep, StepRenderer>>;

export type FlowConfig<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = Readonly<{
  stepOrder: readonly TStep[];
  stepConfigs: Record<TStep, TStepConfig>;
  initialStep?: TStep;
  initialHistory?: TStep[];
}>;
