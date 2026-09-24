import { Platform } from "react-native";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import {
  CARD_ONBOARDING_ADD_TO_WALLET_COPY,
  CARD_ONBOARDING_COPY,
  CARD_ONBOARDING_STEP_COPY,
  CARD_WALLET_PAY_COPY,
} from "../../__tests__/i18nWrapper";
import { useGetCardStatusQuery } from "@domain/api-card-management";
import { createRenderWidget, setQuery, stepsWith, stepsWithIds } from "./__tests__/shared";

jest.mock("../../onboardingStatus", () => ({
  useCardOnboardingStatus: jest.fn(),
}));

jest.mock("@domain/api-card-management", () => ({ useGetCardStatusQuery: jest.fn() }));

const refetchCardStatus = jest.fn();
const renderWidget = createRenderWidget(render);

type User = ReturnType<typeof userEvent.setup>;

async function openWidget(user: User) {
  await user.press(screen.getByTestId("pay-card-onboarding-widget-card"));
}

describe("CardOnboardingWidget (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useGetCardStatusQuery).mockReturnValue({
      refetch: refetchCardStatus,
      data: undefined,
    } as unknown as ReturnType<typeof useGetCardStatusQuery>);
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
    expect(screen.getByText(CARD_ONBOARDING_STEP_COPY["choose-card-type"].title)).toBeVisible();
    expect(screen.getByTestId("pay-card-onboarding-step-top-up-card").props.disabled).toBe(true);
    expect(screen.queryByText(CARD_ONBOARDING_COPY.gotIt)).toBeNull();
  });

  it("should render the wallet step wherever the derived steps place it", async () => {
    const user = userEvent.setup();
    setQuery({
      data: { steps: stepsWithIds("top-up-card", "apple-google-pay", "first-purchase") },
    });
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
    setQuery({
      data: { steps: stepsWithIds("top-up-card", "apple-google-pay", "first-purchase") },
    });
    renderWidget();
    await openWidget(user);

    expect(screen.getByText(CARD_WALLET_PAY_COPY.Apple)).toBeVisible();
    expect(
      screen.getByText(CARD_ONBOARDING_STEP_COPY["apple-google-pay"].description),
    ).toBeVisible();
  });

  it("should label the wallet step with the Google Pay copy on Android", async () => {
    const originalOS = Platform.OS;
    Platform.OS = "android";
    try {
      const user = userEvent.setup();
      setQuery({
        data: { steps: stepsWithIds("top-up-card", "apple-google-pay", "first-purchase") },
      });
      renderWidget();
      await openWidget(user);

      expect(screen.getByText(CARD_WALLET_PAY_COPY.Google)).toBeVisible();
    } finally {
      Platform.OS = originalOS;
    }
  });

  it("should close the dialog from the sheet dismiss control", async () => {
    const user = userEvent.setup();
    setQuery({ data: { steps: stepsWith(true, false) } });
    renderWidget();
    await openWidget(user);

    await user.press(screen.getByTestId("pay-card-onboarding-sheet-dismiss"));

    expect(screen.queryByText(CARD_ONBOARDING_COPY.dialogTitle)).toBeNull();
  });

  it("should open the wallet instructions scene without marking the step done", async () => {
    const user = userEvent.setup();
    const steps = stepsWithIds("top-up-card", "apple-google-pay", "first-purchase").map(step => ({
      ...step,
      isDone: step.id === "top-up-card",
    }));
    setQuery({ data: { steps } });
    renderWidget();
    await openWidget(user);

    await user.press(screen.getByTestId("pay-card-onboarding-step-apple-google-pay"));

    expect(screen.getByTestId("pay-card-add-to-wallet-instructions")).toBeVisible();
    expect(screen.getByText(CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.cta)).toBeVisible();
    // Opening the scene answers nothing: only the provider does, and it has not been re-asked.
    expect(refetchCardStatus).not.toHaveBeenCalled();
  });

  it("should return to onboarding after opening the wallet", async () => {
    const user = userEvent.setup();
    const steps = stepsWithIds("top-up-card", "apple-google-pay", "first-purchase").map(step => ({
      ...step,
      isDone: step.id === "top-up-card",
    }));
    setQuery({ data: { steps } });
    renderWidget();
    await openWidget(user);
    await user.press(screen.getByTestId("pay-card-onboarding-step-apple-google-pay"));

    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta"));

    expect(refetchCardStatus).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("pay-card-add-to-wallet-instructions")).toBeNull();
    expect(screen.getByText(CARD_ONBOARDING_COPY.dialogTitle)).toBeVisible();
  });

  it("should return to onboarding from the wallet instructions back button", async () => {
    const user = userEvent.setup();
    const steps = stepsWithIds("top-up-card", "apple-google-pay", "first-purchase").map(step => ({
      ...step,
      isDone: step.id === "top-up-card",
    }));
    setQuery({ data: { steps } });
    renderWidget();
    await openWidget(user);
    await user.press(screen.getByTestId("pay-card-onboarding-step-apple-google-pay"));

    await user.press(screen.getByTestId("pay-card-onboarding-sheet-back"));

    expect(screen.queryByTestId("pay-card-add-to-wallet-instructions")).toBeNull();
    expect(screen.getByText(CARD_ONBOARDING_COPY.dialogTitle)).toBeVisible();
  });

  it("should show the Android wallet copy when pressing the step on Android", async () => {
    const originalOS = Platform.OS;
    Platform.OS = "android";
    try {
      const user = userEvent.setup();
      const steps = stepsWithIds("top-up-card", "apple-google-pay", "first-purchase").map(step => ({
        ...step,
        isDone: step.id === "top-up-card",
      }));
      setQuery({ data: { steps } });
      renderWidget();
      await openWidget(user);

      await user.press(screen.getByTestId("pay-card-onboarding-step-apple-google-pay"));

      expect(screen.getByText(CARD_ONBOARDING_ADD_TO_WALLET_COPY.android.title)).toBeVisible();
    } finally {
      Platform.OS = originalOS;
    }
  });

  it("should hide the widget after got-it completes onboarding", async () => {
    const user = userEvent.setup();
    setQuery({ data: { steps: stepsWith(true) } });
    renderWidget();

    expect(screen.getByTestId("pay-card-onboarding-widget-card").props.title).toBe(
      CARD_ONBOARDING_COPY.widgetAllDone,
    );

    await openWidget(user);
    await user.press(screen.getByTestId("pay-card-onboarding-got-it"));

    expect(screen.queryByTestId("pay-card-onboarding-widget-card")).toBeNull();
  });
});
