import React, { type FC, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import type { PayCardOnboardingStep } from "@domain/api-card-management";
import { CARD_ONBOARDING_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { payCardOnboardingWidgetSlice } from "../../state";
import { CardOnboardingWidget } from "./CardOnboardingWidget";

jest.mock("@domain/api-card-management", () => ({
  useGetCardOnboardingStatusQuery: jest.fn(),
}));

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

function renderWidget({ hasCompletedOnboarding = false } = {}) {
  const store = configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
    preloadedState: { payCardOnboardingWidget: { hasCompletedOnboarding } },
  });
  const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <I18nWrapper>{children}</I18nWrapper>
    </Provider>
  );

  return render(<CardOnboardingWidget />, { wrapper });
}

function openWidget(name: string = CARD_ONBOARDING_COPY.widgetTitle) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("CardOnboardingWidget (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should hide the widget while onboarding status is loading", () => {
    setQuery({ isLoading: true });
    renderWidget();

    expect(
      screen.queryByRole("button", { name: CARD_ONBOARDING_COPY.widgetTitle }),
    ).not.toBeInTheDocument();
  });

  it("should hide the widget when onboarding status fails", () => {
    setQuery({ isError: true });
    renderWidget();

    expect(
      screen.queryByRole("button", { name: CARD_ONBOARDING_COPY.widgetTitle }),
    ).not.toBeInTheDocument();
  });

  it("should hide the widget when onboarding is already completed in the store", () => {
    setQuery({ data: { steps: stepsWith(false) } });
    renderWidget({ hasCompletedOnboarding: true });

    expect(
      screen.queryByRole("button", { name: CARD_ONBOARDING_COPY.widgetTitle }),
    ).not.toBeInTheDocument();
  });

  it("should keep the in-progress title when the step list is empty", () => {
    setQuery({ data: { steps: [] } });
    renderWidget();

    expect(screen.getByRole("button", { name: CARD_ONBOARDING_COPY.widgetTitle })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: CARD_ONBOARDING_COPY.widgetAllDone }),
    ).not.toBeInTheDocument();
  });

  it("should open the dialog from the widget card with done, active, and pending steps", () => {
    setQuery({ data: { steps: stepsWith(true, false, false) } });
    renderWidget();
    openWidget();

    expect(screen.getByRole("heading", { name: CARD_ONBOARDING_COPY.dialogTitle })).toBeVisible();
    expect(screen.getByText(CARD_ONBOARDING_COPY.stepComplete)).toBeVisible();
    expect(screen.getByRole("button", { name: /Step 1/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Step 2/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: CARD_ONBOARDING_COPY.gotIt }),
    ).not.toBeInTheDocument();
  });

  it("should close the dialog from the header close button", () => {
    setQuery({ data: { steps: stepsWith(true, false) } });
    renderWidget();
    openWidget();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(
      screen.queryByRole("heading", { name: CARD_ONBOARDING_COPY.dialogTitle }),
    ).not.toBeInTheDocument();
  });

  it("should hide the widget after got-it completes onboarding", () => {
    setQuery({ data: { steps: stepsWith(true) } });
    renderWidget();

    openWidget(CARD_ONBOARDING_COPY.widgetAllDone);
    fireEvent.click(screen.getByRole("button", { name: CARD_ONBOARDING_COPY.gotIt }));

    expect(
      screen.queryByRole("button", { name: CARD_ONBOARDING_COPY.widgetAllDone }),
    ).not.toBeInTheDocument();
  });
});
