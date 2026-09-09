import React, { type FC, type ReactElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  useGetCardOnboardingStatusQuery,
  type PayCardOnboardingStep,
} from "@domain/api-card-management";
import { I18nWrapper } from "../../../__tests__/i18nWrapper";
import { payCardOnboardingWidgetSlice } from "../../../state";
import { CardOnboardingWidget } from "../CardOnboardingWidget";

const mockedQuery = jest.mocked(useGetCardOnboardingStatusQuery);
type QueryResult = ReturnType<typeof useGetCardOnboardingStatusQuery>;

type RenderWidget = (
  ui: ReactElement,
  options: { wrapper: FC<{ children: ReactNode }> },
) => unknown;

export function setQuery(state: {
  data?: { steps: PayCardOnboardingStep[] };
  isLoading?: boolean;
  isError?: boolean;
}) {
  mockedQuery.mockReturnValue({
    data: state.data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    refetch: jest.fn(),
  } as unknown as QueryResult);
}

export function stepsWith(...done: boolean[]): PayCardOnboardingStep[] {
  return done.map((isDone, index) => ({
    id: `step-${index}`,
    title: `Step ${index}`,
    description: `Description ${index}`,
    isDone,
  }));
}

export function stepsWithIds(...ids: string[]): PayCardOnboardingStep[] {
  return ids.map(id => ({
    id,
    title: `Title ${id}`,
    description: `Description ${id}`,
    isDone: false,
  }));
}

export function createRenderWidget(render: RenderWidget) {
  return function renderWidget({
    hasCompletedOnboarding = false,
    hasAddedCardToWallet = false,
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

    return render(<CardOnboardingWidget />, { wrapper });
  };
}
