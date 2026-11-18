import React from "react";
import { Text } from "react-native";
import { AppAvailability } from "@features/flow-app-availability";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import { WaitForAppReady } from "../WaitForAppReady";

const GEO_BLOCK_CHECK_URL = "https://countervalues.live.ledger.com/v3/markets";
// WaitForAppReady lets the app through after this long, whatever the check.
const GATE_CAP_MS = 1_000;

const endpoints = {
  geoBlockCheck: jest.fn<Response | Promise<Response>, [{ request: Request }]>(),
};

const failedCheck = () => HttpResponse.text("", { status: 500 });
const blockedCheck = () => HttpResponse.text("", { status: 451 });

/** A check that answers with `respond` only once the test calls `answer`. */
function heldCheck(respond: () => Response = failedCheck) {
  let resolveResponse!: (response: Response) => void;
  const response = new Promise<Response>(resolve => {
    resolveResponse = resolve;
  });
  return { respond: () => response, answer: () => resolveResponse(respond()) };
}

// As in src/index.tsx: AppAvailability mounts only once WaitForAppReady lets the app through.
function renderApp() {
  return render(
    <WaitForAppReady currencyInitialized>
      <AppAvailability>
        <Text>App is Ready</Text>
      </AppAvailability>
    </WaitForAppReady>,
  );
}

describe("WaitForAppReady with AppAvailability and the real geo-block check", () => {
  beforeEach(() => {
    endpoints.geoBlockCheck.mockReset().mockImplementation(failedCheck);
    server.use(http.get(GEO_BLOCK_CHECK_URL, endpoints.geoBlockCheck));
  });

  it("should hide the app while the first geo-block check is pending", async () => {
    const check = heldCheck();
    endpoints.geoBlockCheck.mockImplementationOnce(check.respond);

    renderApp();

    await waitFor(() => expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("App is Ready")).not.toBeOnTheScreen();
    check.answer();
    await waitFor(() => expect(screen.getByText("App is Ready")).toBeVisible());
  });

  it("should keep the app visible while AppAvailability refetches a failed geo-block check", async () => {
    const refetch = heldCheck();
    endpoints.geoBlockCheck
      .mockImplementationOnce(failedCheck)
      .mockImplementationOnce(refetch.respond);

    renderApp();

    await waitFor(() => expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(2));
    expect(screen.getByText("App is Ready")).toBeVisible();
    refetch.answer();
    await waitFor(() => expect(screen.getByText("App is Ready")).toBeVisible());
    expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(2);
  });

  it("should show the blocked screen instead of the app when the check answers 451", async () => {
    endpoints.geoBlockCheck.mockImplementation(blockedCheck);

    renderApp();

    await waitFor(() => expect(screen.getByText("Location unavailable")).toBeVisible());
    expect(screen.queryByText("App is Ready")).not.toBeOnTheScreen();
    expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(1);
  });

  it("should replace the app with the blocked screen when the check fails, then answers 451", async () => {
    endpoints.geoBlockCheck
      .mockImplementationOnce(failedCheck)
      .mockImplementationOnce(blockedCheck);

    renderApp();

    await waitFor(() => expect(screen.getByText("Location unavailable")).toBeVisible());
    expect(screen.queryByText("App is Ready")).not.toBeOnTheScreen();
    expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(2);
  });

  it("should replace the app with the blocked screen when a 451 arrives after the cap", async () => {
    const check = heldCheck(blockedCheck);
    endpoints.geoBlockCheck.mockImplementationOnce(check.respond);

    renderApp();

    await waitFor(() => expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(1));
    await act(async () => {
      jest.advanceTimersByTime(GATE_CAP_MS);
    });
    expect(screen.getByText("App is Ready")).toBeVisible();
    check.answer();
    await waitFor(() => expect(screen.getByText("Location unavailable")).toBeVisible());
    expect(screen.queryByText("App is Ready")).not.toBeOnTheScreen();
    expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(1);
  });

  it("should send a failing geo-block check only once more, when AppAvailability mounts", async () => {
    renderApp();

    await waitFor(() => expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText("App is Ready")).toBeVisible());
    expect(endpoints.geoBlockCheck).toHaveBeenCalledTimes(2);
  });
});
