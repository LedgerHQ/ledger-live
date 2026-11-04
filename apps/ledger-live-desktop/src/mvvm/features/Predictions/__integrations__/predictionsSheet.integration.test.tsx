import React from "react";
import { act, render, renderHook, screen, waitFor } from "tests/testSetup";
import { PredictionsSheet } from "@features/flow-predictions";
import { LinkingProvider } from "@shared/linking";
import { usePredictionsHandlers } from "../hooks/usePredictionsHandlers";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-server"),
  customWrapper: jest.fn(handler => handler),
}));

const openExternal = jest.fn();

type Handlers = Record<string, (params?: unknown) => Promise<unknown>>;

const TERMS_VERSIONS = { termsVersion: "1", disclaimerVersion: "1" };
const CONSENT_VERSION = { disclosureVersion: "1" };

function setup() {
  const onClose = jest.fn();
  const view = render(
    <LinkingProvider config={{ openExternal }}>
      <PredictionsSheet />
    </LinkingProvider>,
  );
  const liveApp = renderHook(() => usePredictionsHandlers(onClose) as unknown as Handlers, {
    store: view.store,
  });
  const call = (method: string, params?: unknown) => {
    let answer: Promise<unknown> = Promise.resolve();
    act(() => {
      answer = liveApp.result.current[method](params);
    });
    return answer;
  };
  return { user: view.user, store: view.store, onClose, call, closeLiveApp: liveApp.unmount };
}

const dialogIsClosed = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

describe("Predictions onboarding sheet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should show the intro until the user discovers predictions", async () => {
    const { user, store, call } = setup();

    const answer = call("custom.predictions.onboard", { intro: {} });

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Trade on future events");
    expect(screen.getByRole("presentation")).toBeVisible();
    expect(
      screen.getByText(/^Now you can access the world's largest prediction market/),
    ).toBeVisible();
    expect(screen.getByText("Access Polymarket in Ledger Wallet")).toBeVisible();
    expect(screen.getByText("Sports, Tech, Crypto, Weather, Politics")).toBeVisible();
    expect(screen.getByText("You define and clear sign the amount to trade")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Discover predictions" }));

    await expect(answer).resolves.toEqual({ isCompleted: true });
    await dialogIsClosed();
    expect(store.getState().predictions.hasSeenIntro).toBe(true);

    await expect(call("custom.predictions.onboard", { intro: {} })).resolves.toEqual({
      isCompleted: true,
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should walk through every step in the same dialog and resolve the accepted versions", async () => {
    const { user, store, call } = setup();

    const answer = call("custom.predictions.onboard", {
      intro: {},
      terms: TERMS_VERSIONS,
      consent: CONSENT_VERSION,
    });

    const dialog = await screen.findByRole("dialog", { name: "Trade on future events" });
    await user.click(screen.getByRole("button", { name: "Discover predictions" }));

    expect(store.getState().predictions.hasSeenIntro).toBe(true);
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleName("Terms & Conditions");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Agree and Continue" }));

    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleName("Clear signed trade on Polymarket via MoonPay");
    await expect(Promise.race([answer, Promise.resolve("pending")])).resolves.toBe("pending");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await expect(answer).resolves.toEqual({
      isCompleted: true,
      terms: TERMS_VERSIONS,
      consent: CONSENT_VERSION,
    });
    await dialogIsClosed();
  });

  it("should answer the steps accepted before the user closes the sheet", async () => {
    const { user, call } = setup();

    const answer = call("custom.predictions.onboard", {
      terms: TERMS_VERSIONS,
      consent: CONSENT_VERSION,
    });
    await screen.findByRole("dialog", { name: "Terms & Conditions" });
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Agree and Continue" }));
    await user.keyboard("{Escape}");

    await expect(answer).resolves.toEqual({ isCompleted: false, terms: TERMS_VERSIONS });
    await dialogIsClosed();
  });

  it("should open the learn more page and keep the intro open", async () => {
    const { user, call } = setup();

    const answer = call("custom.predictions.onboard", { intro: {} });
    await user.click(await screen.findByRole("button", { name: "Learn more" }));

    expect(openExternal).toHaveBeenCalledWith("https://support.ledger.com");
    expect(screen.getByRole("dialog")).toBeVisible();
    await expect(Promise.race([answer, Promise.resolve("pending")])).resolves.toBe("pending");
  });

  it("should answer uncompleted without marking the intro seen when the user closes it", async () => {
    const { user, store, call } = setup();

    const answer = call("custom.predictions.onboard", { intro: {} });
    await user.click(await screen.findByRole("button", { name: /close/i }));

    await expect(answer).resolves.toEqual({ isCompleted: false });
    await dialogIsClosed();
    expect(store.getState().predictions.hasSeenIntro).toBe(false);
  });

  it("should accept the terms once acknowledged and resolve the versions", async () => {
    const { user, call } = setup();

    const answer = call("custom.predictions.onboard", { terms: TERMS_VERSIONS });

    expect(await screen.findByRole("dialog", { name: "Terms & Conditions" })).toBeVisible();
    const cta = screen.getByRole("button", { name: "Agree and Continue" });
    expect(cta).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    await user.click(cta);

    await expect(answer).resolves.toEqual({ isCompleted: true, terms: TERMS_VERSIONS });
    await dialogIsClosed();
  });

  it("should open the terms of use from the terms sheet", async () => {
    const { user, call } = setup();

    call("custom.predictions.onboard", { terms: TERMS_VERSIONS });
    await user.click(await screen.findByText("Terms of Use"));

    expect(openExternal).toHaveBeenCalledWith("https://support.ledger.com");
    expect(screen.getByRole("dialog", { name: "Terms & Conditions" })).toBeVisible();
  });

  it("should refuse terms versions Ledger Wallet has no text for, without opening a sheet", async () => {
    const { call } = setup();

    await expect(
      call("custom.predictions.onboard", {
        terms: { termsVersion: "2", disclaimerVersion: "1" },
      }),
    ).rejects.toMatchObject({ name: "UnsupportedOnboardingVersion" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should answer uncompleted when the user closes the terms", async () => {
    const { user, call } = setup();

    const answer = call("custom.predictions.onboard", { terms: TERMS_VERSIONS });
    await user.click(await screen.findByRole("button", { name: /close/i }));

    await expect(answer).resolves.toEqual({ isCompleted: false });
    await dialogIsClosed();
  });

  it("should give consent once acknowledged and resolve the version", async () => {
    const { user, call } = setup();

    const answer = call("custom.predictions.onboard", { consent: CONSENT_VERSION });

    expect(
      await screen.findByRole("dialog", { name: "Clear signed trade on Polymarket via MoonPay" }),
    ).toBeVisible();
    expect(screen.getByText(/^Dedicated trading wallet:/)).toBeVisible();
    const cta = screen.getByRole("button", { name: "Continue" });
    expect(cta).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    await user.click(cta);

    await expect(answer).resolves.toEqual({ isCompleted: true, consent: CONSENT_VERSION });
  });

  it("should answer uncompleted when the user presses Escape on the consent", async () => {
    const { user, call } = setup();

    const answer = call("custom.predictions.onboard", { consent: CONSENT_VERSION });
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await expect(answer).resolves.toEqual({ isCompleted: false });
  });

  it("should close the sheet and the live app when asked to close", async () => {
    const { call, onClose } = setup();

    call("custom.predictions.onboard", { terms: TERMS_VERSIONS });
    await screen.findByRole("dialog");

    await call("custom.predictions.close");

    expect(onClose).toHaveBeenCalledTimes(1);
    await dialogIsClosed();
  });

  it("should close the sheet when the live app unmounts", async () => {
    const { call, closeLiveApp } = setup();

    call("custom.predictions.onboard", { terms: TERMS_VERSIONS });
    await screen.findByRole("dialog");

    closeLiveApp();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
