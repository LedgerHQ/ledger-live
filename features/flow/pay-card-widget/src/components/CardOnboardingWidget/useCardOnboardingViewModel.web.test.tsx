import React, { type FC, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { PayCardOnboardingStep } from "@domain/api-card-management";
import { payCardOnboardingWidgetSlice } from "../../state";
import { useCardOnboardingViewModel } from "./useCardOnboardingViewModel";

jest.mock("@domain/api-card-management", () => ({
  useGetCardOnboardingStatusQuery: jest.fn(),
}));

// Imported after the mock so it resolves to the jest.fn().
import { useGetCardOnboardingStatusQuery } from "@domain/api-card-management";

const mockedQuery = jest.mocked(useGetCardOnboardingStatusQuery);
type QueryResult = ReturnType<typeof useGetCardOnboardingStatusQuery>;

function setQuery(state: {
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

function stepsWith(...done: boolean[]): PayCardOnboardingStep[] {
  return done.map((isDone, index) => ({
    id: `step-${index}`,
    title: `Step ${index}`,
    description: `Description ${index}`,
    isDone,
  }));
}

function makeStore(hasCompletedOnboarding = false) {
  return configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
    preloadedState: { payCardOnboardingWidget: { hasCompletedOnboarding } },
  });
}

function renderViewModel(store = makeStore()) {
  const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...renderHook(() => useCardOnboardingViewModel(), { wrapper }) };
}

describe("useCardOnboardingViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setQuery({ data: undefined, isLoading: true });
  });

  it("exposes the loading state with no steps", () => {
    setQuery({ isLoading: true });
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      isLoading: true,
      isError: false,
      steps: [],
      completedCount: 0,
      totalCount: 0,
      onboardingCompleted: false,
    });
  });

  it("surfaces the error state", () => {
    setQuery({ isError: true });
    const { result } = renderViewModel();

    expect(result.current.isError).toBe(true);
  });

  it("counts completed steps and reports partial progress", () => {
    setQuery({ data: { steps: stepsWith(true, false, true) } });
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      completedCount: 2,
      totalCount: 3,
      onboardingCompleted: false,
    });
  });

  it("reports completion once every step is done", () => {
    setQuery({ data: { steps: stepsWith(true, true) } });
    const { result } = renderViewModel();

    expect(result.current.onboardingCompleted).toBe(true);
  });

  it("does not report completion for an empty step list", () => {
    setQuery({ data: { steps: [] } });
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({ totalCount: 0, onboardingCompleted: false });
  });

  it("opens and closes the dialog", () => {
    setQuery({ data: { steps: stepsWith(false) } });
    const { result } = renderViewModel();

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.handleOpen());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.handleClose());
    expect(result.current.isOpen).toBe(false);
  });

  it("marks onboarding completed and closes the dialog on 'got it'", () => {
    setQuery({ data: { steps: stepsWith(true) } });
    const { result, store } = renderViewModel();

    act(() => result.current.handleOpen());
    act(() => result.current.handleGotIt());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(store.getState().payCardOnboardingWidget.hasCompletedOnboarding).toBe(true);
  });

  it("reflects the persisted completion flag from the store", () => {
    setQuery({ data: { steps: stepsWith(false) } });
    const { result } = renderViewModel(makeStore(true));

    expect(result.current.hasCompletedOnboarding).toBe(true);
  });
});
