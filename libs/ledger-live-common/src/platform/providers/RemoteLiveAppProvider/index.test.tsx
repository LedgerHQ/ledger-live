/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RemoteLiveAppProvider, useRemoteLiveAppContext } from "./index";
import api from "./api";
import type { LiveAppManifest } from "../../types";

jest.mock("./api", () => ({
  __esModule: true,
  default: { fetchLiveAppManifests: jest.fn() },
}));
jest.mock("@features/platform-env", () => ({
  __esModule: true,
  default: () => "https://catalog.example.com",
}));

const fetchLiveAppManifests = jest.mocked(api.fetchLiveAppManifests);

const manifests = [{ id: "buy-sell-ui" }] as LiveAppManifest[];

// Well beyond any retry delay: nothing here may rely on the periodic refresh.
const UPDATE_FREQUENCY = 30 * 60 * 1000;

function Probe() {
  const { state } = useRemoteLiveAppContext();
  return (
    <>
      <div data-testid="ids">{Object.keys(state.value?.liveAppById ?? {}).join(",")}</div>
      <div data-testid="error">{state.error ? "has-error" : "no-error"}</div>
    </>
  );
}

function renderProvider() {
  return render(
    <RemoteLiveAppProvider
      updateFrequency={UPDATE_FREQUENCY}
      parameters={{
        platform: "android",
        allowDebugApps: false,
        allowExperimentalApps: false,
        llVersion: "1.0.0",
      }}
    >
      <Probe />
    </RemoteLiveAppProvider>,
  );
}

describe("RemoteLiveAppProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("exposes the manifests when the catalog loads", async () => {
    fetchLiveAppManifests.mockResolvedValue(manifests);
    renderProvider();

    await waitFor(() => expect(screen.getByTestId("ids").textContent).toBe("buy-sell-ui"));
    expect(screen.getByTestId("error").textContent).toBe("no-error");
  });

  // Regression: a failed catalog fetch used to be stored as a *successful* empty
  // registry (error: null), so nothing could tell the catalog had never loaded.
  it("reports an error instead of a silently empty catalog when the fetch fails", async () => {
    fetchLiveAppManifests.mockRejectedValue(new Error("Network Error"));
    renderProvider();

    await waitFor(() => expect(screen.getByTestId("error").textContent).toBe("has-error"));
    expect(screen.getByTestId("ids").textContent).toBe("");
  });

  // Regression: the only refetch was the `updateFrequency` interval (30 min in the
  // apps), so a transient failure at startup - e.g. the device network not being
  // up yet - left every live app unresolvable for the whole session.
  it("retries shortly after a failure instead of waiting for the next scheduled refresh", async () => {
    jest.useFakeTimers();
    fetchLiveAppManifests
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValue(manifests);

    renderProvider();

    // Let the initial (failing) attempt settle.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByTestId("ids").textContent).toBe("");

    // Well under UPDATE_FREQUENCY: recovery must come from the retry, not the interval.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });

    expect(screen.getByTestId("ids").textContent).toBe("buy-sell-ui");
    expect(screen.getByTestId("error").textContent).toBe("no-error");
  });
});
