import React from "react";
import { BackHandler } from "react-native";
import { act, render, renderHook, screen } from "@tests/test-renderer";
import type { QueuedBottomSheetProps } from "@shared/ui-queued-bottom-sheet";
import { PredictionsSheet } from "@features/flow-predictions";
import { LinkingProvider } from "@shared/linking";
import { usePredictionsHandlers } from "LLM/features/Predictions";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-server"),
  customWrapper: jest.fn(handler => handler),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = require("react-native");
  return {
    ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
    BottomSheetView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
    BottomSheetScrollView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
    BottomSheetHeader: ({ title, description }: { title?: string; description?: string }) => (
      <RN.View>
        {title ? <RN.Text>{title}</RN.Text> : null}
        {description ? <RN.Text>{description}</RN.Text> : null}
      </RN.View>
    ),
  };
});

const mockQueuedBottomSheet = jest.fn();
jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: (props: QueuedBottomSheetProps) => {
    mockQueuedBottomSheet(props);
    const { QueuedBottomSheet } = jest.requireActual(
      "@shared/ui-queued-bottom-sheet/testing/module-mock",
    );
    return <QueuedBottomSheet {...props} />;
  },
}));

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

type Handlers = Record<string, (params?: unknown) => Promise<unknown>>;

const openExternal = jest.fn();

const TERMS_VERSIONS = { termsVersion: "1", disclaimerVersion: "1" };
const CONSENT_VERSION = { disclosureVersion: "1" };

function renderPredictions() {
  const player = renderHook(() => usePredictionsHandlers());
  const view = render(
    <LinkingProvider config={{ openExternal }}>
      <PredictionsSheet />
    </LinkingProvider>,
  );

  const call = (method: string, params: unknown) => {
    const handlers = player.result.current as unknown as Handlers;
    let answer: Promise<unknown> = Promise.resolve();
    act(() => {
      answer = handlers[method](params);
    });
    return answer;
  };

  const unmount = () => {
    player.unmount();
    view.unmount();
  };

  return { ...view, store: player.store, call, unmount, unmountPlayer: player.unmount };
}

const isSheetOpen = () =>
  screen.getByTestId("predictions-sheet").props.accessibilityState.expanded === true;

const lastSheetProps = (): QueuedBottomSheetProps => mockQueuedBottomSheet.mock.lastCall[0];

function spyOnBackPressHandlers() {
  const backPressHandlers: Array<() => boolean | null | undefined> = [];
  jest.spyOn(BackHandler, "addEventListener").mockImplementation((event, handler) => {
    if (event === "hardwareBackPress") backPressHandlers.push(handler);
    return {
      remove: () => backPressHandlers.splice(backPressHandlers.indexOf(handler), 1),
    } as unknown as ReturnType<typeof BackHandler.addEventListener>;
  });
  return backPressHandlers;
}

describe("PredictionsSheet", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("should show the intro until the user discovers predictions", async () => {
    const { user, store, call, unmount } = renderPredictions();

    const answer = call("custom.predictions.onboard", { intro: {} });

    expect(isSheetOpen()).toBe(true);
    expect(screen.getByTestId("predictions-intro-hero-image")).toBeVisible();
    expect(screen.getByText("Trade on future events")).toBeVisible();
    expect(
      screen.getByText(/^Now you can access the world's largest prediction market/),
    ).toBeVisible();
    expect(screen.getByText("Access Polymarket in Ledger Wallet")).toBeVisible();
    expect(screen.getByText("Sports, Tech, Crypto, Weather, Politics")).toBeVisible();
    expect(screen.getByText("You define and clear sign the amount to trade")).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Discover predictions" }));

    await expect(answer).resolves.toEqual({ isCompleted: true });
    expect(isSheetOpen()).toBe(false);
    expect(store.getState().predictions.hasSeenIntro).toBe(true);

    await expect(call("custom.predictions.onboard", { intro: {} })).resolves.toEqual({
      isCompleted: true,
    });
    expect(isSheetOpen()).toBe(false);
    unmount();
  });

  it("should walk through every step without closing the sheet in between", async () => {
    const { user, store, call, unmount } = renderPredictions();

    const answer = call("custom.predictions.onboard", {
      intro: {},
      terms: TERMS_VERSIONS,
      consent: CONSENT_VERSION,
    });
    const rendersBeforeFlow = mockQueuedBottomSheet.mock.calls.length - 1;

    await user.press(screen.getByRole("button", { name: "Discover predictions" }));

    expect(store.getState().predictions.hasSeenIntro).toBe(true);
    expect(screen.getByText("Terms & Conditions")).toBeVisible();
    await user.press(
      screen.getByText(/You acknowledge that you have read and understand the above disclaimer/),
    );
    await user.press(screen.getByRole("button", { name: "Agree and Continue" }));

    expect(screen.getByText("Clear signed trade on Polymarket via MoonPay")).toBeVisible();
    const flowRenders = mockQueuedBottomSheet.mock.calls.slice(rendersBeforeFlow);
    expect(flowRenders.every(([props]) => props.isRequestingToBeOpened)).toBe(true);

    await user.press(screen.getByText(/By continuing, you agree to create a MoonPay Trade/));
    await user.press(screen.getByRole("button", { name: "Continue" }));

    await expect(answer).resolves.toEqual({
      isCompleted: true,
      terms: TERMS_VERSIONS,
      consent: CONSENT_VERSION,
    });
    expect(isSheetOpen()).toBe(false);
    unmount();
  });

  it("should bring the same step back after a lock instead of closing the onboarding", () => {
    const { call, unmount } = renderPredictions();

    call("custom.predictions.onboard", { terms: TERMS_VERSIONS });

    expect(lastSheetProps()).toMatchObject({ restoreOnFocus: true });
    unmount();
  });

  it("should open the learn more page and keep the intro open", async () => {
    const { user, call, unmount } = renderPredictions();
    const answer = call("custom.predictions.onboard", { intro: {} });

    await user.press(screen.getByRole("button", { name: "Learn more" }));

    expect(openExternal).toHaveBeenCalledWith("https://support.ledger.com");
    expect(isSheetOpen()).toBe(true);
    await expect(Promise.race([answer, Promise.resolve("pending")])).resolves.toBe("pending");
    unmount();
  });

  it("should answer uncompleted without marking the intro seen when the user closes it", async () => {
    const { user, store, call, unmount } = renderPredictions();
    const outcome = call("custom.predictions.onboard", { intro: {} });

    await user.press(screen.getByTestId("predictions-sheet-header-close"));

    expect(await outcome).toEqual({ isCompleted: false });
    expect(isSheetOpen()).toBe(false);
    expect(store.getState().predictions.hasSeenIntro).toBe(false);
    unmount();
  });

  it("should accept the consent only once the checkbox is ticked", async () => {
    const { user, call, unmount } = renderPredictions();

    const answer = call("custom.predictions.onboard", { consent: CONSENT_VERSION });

    expect(screen.getByText("Clear signed trade on Polymarket via MoonPay")).toBeVisible();
    expect(screen.getByText(/^Dedicated trading wallet: /)).toBeVisible();
    expect(screen.getByText(/^Secure signing: /)).toBeVisible();
    expect(screen.getByText(/^Withdraw anytime: /)).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.press(screen.getByText(/By continuing, you agree to create a MoonPay Trade/));
    await user.press(screen.getByRole("button", { name: "Continue" }));

    await expect(answer).resolves.toEqual({ isCompleted: true, consent: CONSENT_VERSION });
    expect(isSheetOpen()).toBe(false);
    unmount();
  });

  it("should accept the terms only once they are acknowledged", async () => {
    const { user, call, unmount } = renderPredictions();

    const answer = call("custom.predictions.onboard", { terms: TERMS_VERSIONS });

    expect(screen.getByText("Terms & Conditions")).toBeVisible();
    expect(screen.getByText(/^Prediction markets are speculative/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Agree and Continue" })).toBeDisabled();

    await user.press(
      screen.getByText(/You acknowledge that you have read and understand the above disclaimer/),
    );
    await user.press(screen.getByRole("button", { name: "Agree and Continue" }));

    await expect(answer).resolves.toEqual({ isCompleted: true, terms: TERMS_VERSIONS });
    expect(isSheetOpen()).toBe(false);
    unmount();
  });

  it("should open the terms of use from the terms sheet", async () => {
    const { user, call, unmount } = renderPredictions();
    call("custom.predictions.onboard", { terms: TERMS_VERSIONS });

    await user.press(screen.getByRole("link", { name: "Terms of Use" }));

    expect(openExternal).toHaveBeenCalledWith("https://support.ledger.com");
    expect(isSheetOpen()).toBe(true);
    unmount();
  });

  it.each(["header-close", "backdrop"])(
    "should answer uncompleted when the user dismisses the sheet from the %s",
    async closeControl => {
      const { user, call, unmount } = renderPredictions();
      const outcome = call("custom.predictions.onboard", { terms: TERMS_VERSIONS });

      await user.press(screen.getByTestId(`predictions-sheet-${closeControl}`));

      expect(await outcome).toEqual({ isCompleted: false });
      expect(isSheetOpen()).toBe(false);
      unmount();
    },
  );

  it("should answer uncompleted when the user presses the Android back button", async () => {
    const backPressHandlers = spyOnBackPressHandlers();
    const { call, unmount } = renderPredictions();
    const outcome = call("custom.predictions.onboard", { terms: TERMS_VERSIONS });

    let isConsumed: boolean | null | undefined;
    act(() => {
      isConsumed = backPressHandlers.at(-1)?.();
    });

    expect(isConsumed).toBe(true);
    expect(await outcome).toEqual({ isCompleted: false });
    expect(isSheetOpen()).toBe(false);
    unmount();
  });

  it("should leave the Android back alone while the sheet is hidden", async () => {
    const backPressHandlers = spyOnBackPressHandlers();
    const { call, unmount } = renderPredictions();
    const otherHandlerCount = backPressHandlers.length;
    const outcome = call("custom.predictions.onboard", { terms: TERMS_VERSIONS });
    expect(backPressHandlers).toHaveLength(otherHandlerCount + 1);

    act(() => lastSheetProps().onModalHide?.());

    expect(backPressHandlers).toHaveLength(otherHandlerCount);
    await expect(Promise.race([outcome, Promise.resolve("pending")])).resolves.toBe("pending");
    unmount();
  });

  it("should not cancel the next sheet when the accepted one reports its close late", async () => {
    const { user, call, unmount } = renderPredictions();
    const consent = call("custom.predictions.onboard", { consent: CONSENT_VERSION });
    await user.press(screen.getByText(/By continuing, you agree to create a MoonPay Trade/));
    await user.press(screen.getByRole("button", { name: "Continue" }));
    await expect(consent).resolves.toEqual({ isCompleted: true, consent: CONSENT_VERSION });

    const terms = call("custom.predictions.onboard", { terms: TERMS_VERSIONS });
    act(() => lastSheetProps().onClose?.());

    expect(isSheetOpen()).toBe(true);
    await user.press(
      screen.getByText(/You acknowledge that you have read and understand the above disclaimer/),
    );
    await user.press(screen.getByRole("button", { name: "Agree and Continue" }));
    await expect(terms).resolves.toEqual({ isCompleted: true, terms: TERMS_VERSIONS });
    unmount();
  });

  it("should close the sheet and answer uncompleted when the player unmounts", async () => {
    const { call, unmount, unmountPlayer } = renderPredictions();
    const consent = call("custom.predictions.onboard", { consent: CONSENT_VERSION });

    act(() => unmountPlayer());

    expect(isSheetOpen()).toBe(false);
    await expect(consent).resolves.toEqual({ isCompleted: false });
    unmount();
  });

  it("should close the sheet and go back when the live app closes", () => {
    const { call, unmount } = renderPredictions();
    call("custom.predictions.onboard", { terms: TERMS_VERSIONS });

    call("custom.predictions.close", {});

    expect(isSheetOpen()).toBe(false);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    unmount();
  });
});
