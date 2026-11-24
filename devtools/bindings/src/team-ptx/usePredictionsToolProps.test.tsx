import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { markPredictionsIntroSeen, predictionsSlice } from "@domain/entity-predictions";
import { usePredictionsToolProps, type LiveAppStore } from "./usePredictionsToolProps";

const setupHooks = {
  startSetup: jest.fn(),
  "binding.reportSetup": jest.fn(() => Promise.resolve()),
};
const SETUP = {
  hooks: setupHooks,
  failureReasons: ["failed-deploy", "timeout", "unavailable", "unknown"] as const,
};

const ADDRESS = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
const ACCEPTED_VERSIONS = { terms: "1", disclaimer: "1", delegationDisclosure: "1" };
const BOUND_STATE = JSON.stringify({
  version: 1,
  acceptedVersions: ACCEPTED_VERSIONS,
  addresses: { [ADDRESS]: { isBound: true } },
  activeAddress: ADDRESS,
});

/** An in-memory live app storage, keyed like Ledger Wallet's. */
function createLiveAppStore(stored: Record<string, string> = {}) {
  const values = new Map(Object.entries(stored));
  const store: LiveAppStore = {
    get: (key, storeId) => Promise.resolve(values.get(`${storeId}-${key}`)),
    set: (key, value, storeId) => {
      values.set(`${storeId}-${key}`, value);
    },
  };
  return { store, values };
}

async function setup(stored?: Record<string, string>) {
  const reduxStore = configureStore({ reducer: { predictions: predictionsSlice.reducer } });
  reduxStore.dispatch(markPredictionsIntroSeen());
  const liveApp = createLiveAppStore(stored);
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={reduxStore}>{children}</Provider>
  );
  const { result } = renderHook(() => usePredictionsToolProps(liveApp.store, SETUP), { wrapper });
  await act(() => result.current.refresh());
  return { result, values: liveApp.values };
}

const PROD_STATE_KEY = "predictions-live-app-onboarding-state";

const STG_STATE_KEY = "predictions-live-app-stg-onboarding-state";
const stored = (values: Map<string, string>) => JSON.parse(values.get(PROD_STATE_KEY) ?? "");

describe("usePredictionsToolProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the intro and everything each environment stored", async () => {
    const { result } = await setup({ [PROD_STATE_KEY]: BOUND_STATE });

    expect(result.current.hasSeenIntro).toBe(true);
    await waitFor(() =>
      expect(result.current.onboardingStates).toEqual([
        {
          manifestId: "predictions-live-app",
          label: "Production",
          isStored: true,
          acceptedVersions: ACCEPTED_VERSIONS,
          addresses: [{ address: ADDRESS, isActive: true, isBound: true }],
          raw: BOUND_STATE,
        },
        {
          manifestId: "predictions-live-app-stg",
          label: "Staging",
          isStored: false,
          acceptedVersions: {},
          addresses: [],
          raw: undefined,
        },
      ]),
    );
  });

  it("reads an unreadable stored value as nothing stored, and still shows it", async () => {
    const { result } = await setup({ [PROD_STATE_KEY]: "{not json" });

    await waitFor(() =>
      expect(result.current.onboardingStates[0]).toMatchObject({
        isStored: false,
        raw: "{not json",
      }),
    );
  });

  it("unbinds the active account, and keeps the rest", async () => {
    const { result, values } = await setup({ [PROD_STATE_KEY]: BOUND_STATE });

    await act(() => result.current.reset("predictions-live-app", "binding"));

    expect(stored(values)).toEqual({
      version: 1,
      acceptedVersions: ACCEPTED_VERSIONS,
      addresses: { [ADDRESS]: { isBound: false } },
      activeAddress: ADDRESS,
    });
    expect(values.has(STG_STATE_KEY)).toBe(false);
  });

  it("forgets the accounts, and keeps the accepted versions", async () => {
    const { result, values } = await setup({ [PROD_STATE_KEY]: BOUND_STATE });

    await act(() => result.current.reset("predictions-live-app", "accounts"));

    expect(stored(values)).toEqual({
      version: 1,
      acceptedVersions: ACCEPTED_VERSIONS,
      addresses: {},
    });
  });

  it("forgets the accepted documents, and keeps the accounts", async () => {
    const { result, values } = await setup({ [PROD_STATE_KEY]: BOUND_STATE });

    await act(() => result.current.reset("predictions-live-app", "documents"));

    expect(stored(values)).toMatchObject({ acceptedVersions: {}, activeAddress: ADDRESS });
  });

  it("forgets everything one environment stored", async () => {
    const { result, values } = await setup({ [PROD_STATE_KEY]: BOUND_STATE });

    await act(() => result.current.reset("predictions-live-app", "everything"));

    expect(values.get(PROD_STATE_KEY)).toBe("");
    expect(result.current.onboardingStates[0]?.isStored).toBe(false);
  });

  it("replays the whole onboarding: forgets the intro and empties every environment", async () => {
    const { result, values } = await setup({ [PROD_STATE_KEY]: BOUND_STATE });

    await act(() => result.current.replayWholeOnboarding());

    expect(result.current.hasSeenIntro).toBe(false);
    expect(values.get(PROD_STATE_KEY)).toBe("");
    expect(values.get(STG_STATE_KEY)).toBe("");
  });

  it("marks the intro as seen or not", async () => {
    const { result } = await setup();

    act(() => result.current.setIntroSeen(false));
    expect(result.current.hasSeenIntro).toBe(false);
    act(() => result.current.setIntroSeen(true));

    expect(result.current.hasSeenIntro).toBe(true);
  });

  it("previews the trading wallet setup, loading or with an outcome the app can show", async () => {
    const { result } = await setup();

    act(() => result.current.previewSetup());
    expect(setupHooks.startSetup).toHaveBeenCalledTimes(1);
    expect(setupHooks["binding.reportSetup"]).not.toHaveBeenCalled();

    act(() => result.current.previewSetup({ outcome: "failed", reason: "timeout" }));

    expect(setupHooks.startSetup).toHaveBeenCalledTimes(2);
    expect(setupHooks["binding.reportSetup"]).toHaveBeenCalledWith({
      outcome: "failed",
      reason: "timeout",
    });
  });

  it("previews a failure the app can't show as an unknown one", async () => {
    const { result } = await setup();

    act(() => result.current.previewSetup({ outcome: "failed", reason: "lost" }));

    expect(setupHooks["binding.reportSetup"]).toHaveBeenLastCalledWith({
      outcome: "failed",
      reason: "unknown",
    });
  });
});
