import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CARD_ONBOARDING_COPY } from "../../__tests__/i18nWrapper";
import { createRenderWidget, setQuery, stepsWith, stepsWithIds } from "./__tests__/shared";

jest.mock("@domain/api-card-management", () => ({
  useGetCardOnboardingStatusQuery: jest.fn(),
}));

const renderWidget = createRenderWidget(render);

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

  it("should show the backend steps without adding the wallet step", () => {
    setQuery({ data: { steps: stepsWithIds("top-up-card", "first-purchase") } });
    renderWidget();
    openWidget();

    expect(screen.getByText("Title top-up-card")).toBeVisible();
    expect(screen.getByText("Title first-purchase")).toBeVisible();
    expect(screen.queryByText(/Apple\/Google Pay/)).not.toBeInTheDocument();
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
