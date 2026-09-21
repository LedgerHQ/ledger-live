import React, { type FC, type ReactElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import type { CardOnboardingStep, CardOnboardingStepId } from "../../../onboardingStatus";
import { useCardOnboardingStatus } from "../../../onboardingStatus";
import { I18nWrapper } from "../../../__tests__/i18nWrapper";
import { payCardOnboardingWidgetSlice } from "../../../state";
import { CardOnboardingWidget } from "../CardOnboardingWidget";

const mockedStatus = jest.mocked(useCardOnboardingStatus);
type StatusResult = ReturnType<typeof useCardOnboardingStatus>;

type RenderWidget = (ui: ReactElement, options: { wrapper: FC<{ children: ReactNode }> }) => object;

export function setQuery(state: {
  data?: { steps: CardOnboardingStep[] };
  isLoading?: boolean;
  isError?: boolean;
}) {
  const steps = state.data?.steps ?? [];
  mockedStatus.mockReturnValue({
    data: { steps, completedCount: steps.filter(step => step.isDone).length },
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    refresh: jest.fn(),
  } as unknown as StatusResult);
}

const REAL_STEP_IDS: readonly CardOnboardingStepId[] = [
  "create-account",
  "choose-card-type",
  "top-up-card",
  "first-purchase",
];

export function stepsWith(...done: boolean[]): CardOnboardingStep[] {
  return done.map((isDone, index) => ({ id: REAL_STEP_IDS[index], isDone }));
}

export function stepsWithIds(...ids: CardOnboardingStepId[]): CardOnboardingStep[] {
  return ids.map(id => ({ id, isDone: false }));
}

export function createRenderWidget(render: RenderWidget) {
  return function renderWidget({
    hasCompletedOnboarding = false,
    hasAddedCardToWallet = false,
    onTopUp,
  }: {
    hasCompletedOnboarding?: boolean;
    hasAddedCardToWallet?: boolean;
    onTopUp?: () => void;
  } = {}) {
    const store = configureStore({
      reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
      preloadedState: { payCardOnboardingWidget: { hasCompletedOnboarding, hasAddedCardToWallet } },
    });
    const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
      <Provider store={store}>
        <I18nWrapper>{children}</I18nWrapper>
      </Provider>
    );

    return { ...render(<CardOnboardingWidget onTopUp={onTopUp} />, { wrapper }), store };
  };
}
