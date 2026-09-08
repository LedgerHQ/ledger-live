import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { CARD_ONBOARDING_COPY } from "../../__tests__/i18nWrapper";
import { createRenderWidget, setQuery, stepsWith, stepsWithIds } from "./__tests__/shared";

jest.mock("@domain/api-card-management", () => ({
  useGetCardOnboardingStatusQuery: jest.fn(),
}));

const renderWidget = createRenderWidget(render);

type User = ReturnType<typeof userEvent.setup>;

async function openWidget(user: User) {
  await user.press(screen.getByTestId("pay-card-onboarding-widget-card"));
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

    expect(screen.queryByTestId("pay-card-onboarding-widget-card")).toBeNull();
  });

  it("should hide the widget when onboarding status fails", () => {
    setQuery({ isError: true });
    renderWidget();

    expect(screen.queryByTestId("pay-card-onboarding-widget-card")).toBeNull();
  });

  it("should hide the widget when onboarding is already completed in the store", () => {
    setQuery({ data: { steps: stepsWith(false) } });
    renderWidget({ hasCompletedOnboarding: true });

    expect(screen.queryByTestId("pay-card-onboarding-widget-card")).toBeNull();
  });

  it("should keep the in-progress title when the step list is empty", () => {
    setQuery({ data: { steps: [] } });
    renderWidget();

    expect(screen.getByTestId("pay-card-onboarding-widget-card").props.title).toBe(
      CARD_ONBOARDING_COPY.widgetTitle,
    );
    expect(screen.getByTestId("pay-card-onboarding-widget-card").props.title).not.toBe(
      CARD_ONBOARDING_COPY.widgetAllDone,
    );
  });

  it("should open the dialog from the widget card with done, active, and pending steps", async () => {
    const user = userEvent.setup();
    setQuery({ data: { steps: stepsWith(true, false, false) } });
    renderWidget();
    await openWidget(user);

    expect(screen.getByText(CARD_ONBOARDING_COPY.dialogTitle)).toBeVisible();
    expect(screen.getByText(CARD_ONBOARDING_COPY.stepComplete)).toBeVisible();
    expect(screen.getByText("Step 1")).toBeVisible();
    expect(screen.getByTestId("pay-card-onboarding-step-step-2").props.disabled).toBe(true);
    expect(screen.queryByText(CARD_ONBOARDING_COPY.gotIt)).toBeNull();
  });

  it("should add the wallet step before the first purchase", async () => {
    const user = userEvent.setup();
    setQuery({ data: { steps: stepsWithIds("top-up-card", "first-purchase") } });
    renderWidget();
    await openWidget(user);

    expect(
      screen.getAllByTestId(/^pay-card-onboarding-step-/).map(step => step.props.testID),
    ).toEqual([
      "pay-card-onboarding-step-top-up-card",
      "pay-card-onboarding-step-apple-google-pay",
      "pay-card-onboarding-step-first-purchase",
    ]);
  });

  it("should label the wallet step with the mobile copy", async () => {
    const user = userEvent.setup();
    setQuery({ data: { steps: stepsWithIds("top-up-card", "first-purchase") } });
    renderWidget();
    await openWidget(user);

    expect(screen.getByText(CARD_ONBOARDING_COPY.walletStepTitle)).toBeVisible();
    expect(screen.getByText(CARD_ONBOARDING_COPY.walletStepDescription)).toBeVisible();
  });

  it("should close the dialog from the sheet dismiss control", async () => {
    const user = userEvent.setup();
    setQuery({ data: { steps: stepsWith(true, false) } });
    renderWidget();
    await openWidget(user);

    await user.press(screen.getByTestId("pay-card-onboarding-sheet-dismiss"));

    expect(screen.queryByText(CARD_ONBOARDING_COPY.dialogTitle)).toBeNull();
  });

  it("should mark the wallet step done once it is pressed", async () => {
    const user = userEvent.setup();
    const steps = stepsWithIds("top-up-card", "first-purchase").map(step => ({
      ...step,
      isDone: step.id === "top-up-card",
    }));
    setQuery({ data: { steps } });
    renderWidget();
    await openWidget(user);

    expect(screen.getAllByText(CARD_ONBOARDING_COPY.stepComplete)).toHaveLength(1);

    await user.press(screen.getByTestId("pay-card-onboarding-step-apple-google-pay"));

    expect(screen.getAllByText(CARD_ONBOARDING_COPY.stepComplete)).toHaveLength(2);
  });

  it("should hide the widget after got-it completes onboarding", async () => {
    const user = userEvent.setup();
    setQuery({ data: { steps: stepsWith(true) } });
    renderWidget({ hasAddedCardToWallet: true });

    expect(screen.getByTestId("pay-card-onboarding-widget-card").props.title).toBe(
      CARD_ONBOARDING_COPY.widgetAllDone,
    );

    await openWidget(user);
    await user.press(screen.getByTestId("pay-card-onboarding-got-it"));

    expect(screen.queryByTestId("pay-card-onboarding-widget-card")).toBeNull();
  });
});
