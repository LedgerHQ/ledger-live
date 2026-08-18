import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { hubStateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { usePostOnboardingContext } from "@ledgerhq/live-common/postOnboarding/hooks/usePostOnboardingContext";
import { PostOnboardingActionId, type PostOnboardingAction } from "@ledgerhq/types-live";
import type { Feature, FeatureId } from "@shared/feature-flags";
import { isPostOnboardingHubActionFulfilled } from "~/renderer/components/PostOnboardingHub/logic/postOnboardingHubCompletion";
import { usePostOnboardingHubCompletionContext } from "~/renderer/components/PostOnboardingHub/logic/usePostOnboardingHubCompletionContext";
import {
  EXCLUDED_FROM_FINISH_FLOW_ID,
  getLumenSymbolForActionId,
  resolveFinishPostOnboardingStartAction,
  toFinishPostOnboardingListItem,
  type FinishPostOnboardingListItem,
} from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";
import type { FinishOnboardingState, FinishOnboardingStep } from "./types";

const getIsFeatureEnabled = (
  action: PostOnboardingAction | undefined,
  getFeature: (id: FeatureId) => Feature | null,
) => {
  if (!action) return false;
  if (!action.featureFlagId) return true;

  const flag = getFeature(action.featureFlagId);
  if (!flag?.enabled) return false;

  const paramId = action.featureFlagParamId;
  if (!paramId) return true;

  const params = flag.params as Record<string, unknown> | undefined;
  return !!params?.[paramId];
};

const buildDeviceOnboardedStep = (): FinishOnboardingStep => ({
  id: PostOnboardingActionId.deviceOnboarded,
  title: "postOnboarding.dialog.actions.deviceOnboarded.title",
  description: "",
  completed: true,
  lumenSymbol: getLumenSymbolForActionId(PostOnboardingActionId.deviceOnboarded),
  shouldCompleteOnStart: false,
  startAction: () => {},
});

const toFinishStep = (
  item: FinishPostOnboardingListItem,
  completed: boolean,
): FinishOnboardingStep => ({
  id: item.id,
  title: item.title,
  description: item.description,
  completed,
  lumenSymbol: item.lumenSymbol,
  buttonLabelForAnalyticsEvent: item.buttonLabelForAnalyticsEvent,
  shouldCompleteOnStart: item.shouldCompleteOnStart,
  startAction: resolveFinishPostOnboardingStartAction(item),
});

const isOptionalStepComplete = (
  item: FinishPostOnboardingListItem,
  asyncCompletionById: Partial<Record<PostOnboardingActionId, boolean>>,
  context: ReturnType<typeof usePostOnboardingHubCompletionContext>,
) =>
  item.completed ||
  !!asyncCompletionById[item.id] ||
  !!item.getIsAlreadyCompletedByState?.({
    isLedgerSyncActive: context.isLedgerSyncActive,
    accounts: context.accounts,
    productTourCompleted: context.productTourCompleted,
  });

/**
 * Finish-onboarding state for the LWD dialog and portfolio widget.
 * Reads post-onboarding redux + action definitions directly instead of {@link usePostOnboardingHubState}.
 */
export function useFinishOnboardingState(): FinishOnboardingState {
  const hubState = useSelector(hubStateSelector);
  const { getPostOnboardingAction } = usePostOnboardingContext();
  const completionContext = usePostOnboardingHubCompletionContext();
  const flags = useFeatureFlags();
  const getFeature = useCallback((id: FeatureId): Feature | null => flags[id] ?? null, [flags]);

  const optionalItems = useMemo(() => {
    if (!getPostOnboardingAction) {
      return [];
    }

    return hubState.actionsToComplete.flatMap(actionId => {
      if (
        actionId === EXCLUDED_FROM_FINISH_FLOW_ID ||
        actionId === PostOnboardingActionId.deviceOnboarded
      ) {
        return [];
      }

      const action = getPostOnboardingAction(actionId);
      if (!action || !getIsFeatureEnabled(action, getFeature)) {
        return [];
      }

      return [
        toFinishPostOnboardingListItem({
          ...action,
          completed: !!hubState.actionsCompleted[actionId],
        }),
      ];
    });
  }, [getFeature, getPostOnboardingAction, hubState.actionsCompleted, hubState.actionsToComplete]);

  const [asyncCompletionById, setAsyncCompletionById] = useState<
    Partial<Record<PostOnboardingActionId, boolean>>
  >({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      optionalItems.map(async item => {
        const result = await isPostOnboardingHubActionFulfilled(item, completionContext).catch(
          () => false,
        );
        return [item.id, result] as const;
      }),
    ).then(entries => {
      if (cancelled) return;
      setAsyncCompletionById(
        entries.reduce<Partial<Record<PostOnboardingActionId, boolean>>>((acc, [id, done]) => {
          acc[id] = done;
          return acc;
        }, {}),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [optionalItems, completionContext]);

  return useMemo(() => {
    const deviceStep = buildDeviceOnboardedStep();
    const optionalSteps = optionalItems.map(item =>
      toFinishStep(item, isOptionalStepComplete(item, asyncCompletionById, completionContext)),
    );
    const steps = [deviceStep, ...optionalSteps];

    const completedOptionalSteps = optionalSteps.filter(step => step.completed).length;
    const totalOptionalSteps = optionalSteps.length;

    return {
      deviceModelId: hubState.deviceModelId,
      postOnboardingInProgress: hubState.postOnboardingInProgress,
      steps,
      completedStepsAmount: completedOptionalSteps + 1,
      totalStepsAmount: totalOptionalSteps + 1,
      allStepsCompleted: totalOptionalSteps === 0 || completedOptionalSteps === totalOptionalSteps,
    };
  }, [
    asyncCompletionById,
    completionContext,
    hubState.deviceModelId,
    hubState.postOnboardingInProgress,
    optionalItems,
  ]);
}
