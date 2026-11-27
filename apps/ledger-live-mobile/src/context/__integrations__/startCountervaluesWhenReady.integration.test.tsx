import React from "react";
import { Text } from "react-native";
import type { UnknownAction } from "@reduxjs/toolkit";
import { AppAvailability } from "@features/flow-app-availability";
import { startCountervaluesSync } from "@features/platform-market-countervalues";
import { act, render, waitFor } from "@tests/test-renderer";
import { http, server } from "@tests/server";
import {
  GEO_BLOCK_CHECK_URL,
  answeredCheck,
  failedCheck,
  heldCheck,
} from "@tests/handlers/geoBlockCheck";
import { WaitForAppReady } from "LLM/contexts/WaitForAppReady";
import { startCountervaluesWhenReady } from "../startCountervaluesWhenReady";

// startCountervaluesWhenReady starts the sync after this long, whatever the check.
const START_CAP_MS = 1_000;
const savedState = { status: {} };

const endpoints = {
  geoBlockCheck: jest.fn<Response | Promise<Response>, [{ request: Request }]>(),
};

// The app tree of src/index.tsx; sync starts are recorded with the fake clock, not run.
function renderApp() {
  const { store } = render(
    <WaitForAppReady currencyInitialized>
      <AppAvailability>
        <Text>App is Ready</Text>
      </AppAvailability>
    </WaitForAppReady>,
  );
  const recordedStarts: { action: UnknownAction; startedAtMs: number }[] = [];
  const appStore = {
    getState: store.getState,
    subscribe: store.subscribe,
    dispatch: <A extends UnknownAction>(action: A): A => {
      if (startCountervaluesSync.match(action)) {
        recordedStarts.push({ action, startedAtMs: Date.now() });
      }
      return action;
    },
  };
  return { appStore, recordedStarts };
}

async function flushStart() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

describe("startCountervaluesWhenReady with the startup gate and the real geo-block check", () => {
  beforeEach(() => {
    endpoints.geoBlockCheck.mockReset().mockImplementation(failedCheck);
    server.use(http.get(GEO_BLOCK_CHECK_URL, endpoints.geoBlockCheck));
  });

  it("should wait for the first geo-block check, then start when it answers", async () => {
    const check = heldCheck(answeredCheck);
    endpoints.geoBlockCheck.mockImplementationOnce(check.respond);
    const { appStore, recordedStarts } = renderApp();
    await waitFor(() => expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(1));

    const calledAtMs = Date.now();
    void startCountervaluesWhenReady(appStore, savedState, Promise.resolve());
    await flushStart();
    expect(recordedStarts).toHaveLength(0);

    check.answer();

    await waitFor(() => expect(recordedStarts).toHaveLength(1));
    expect(recordedStarts[0].startedAtMs - calledAtMs).toBeLessThan(START_CAP_MS);
  });

  it("should start while AppAvailability fetches a failed geo-block check again", async () => {
    const refetch = heldCheck();
    endpoints.geoBlockCheck
      .mockImplementationOnce(failedCheck)
      .mockImplementationOnce(refetch.respond);
    const { appStore, recordedStarts } = renderApp();
    await waitFor(() => expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(2));

    void startCountervaluesWhenReady(appStore, savedState, Promise.resolve());
    await flushStart();

    expect(recordedStarts).toEqual([
      { action: startCountervaluesSync({ savedState }), startedAtMs: Date.now() },
    ]);
    refetch.answer();
    await flushStart();
    expect(recordedStarts).toHaveLength(1);
  });
});
