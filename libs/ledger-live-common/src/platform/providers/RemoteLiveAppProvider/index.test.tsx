/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { LiveAppManifest } from "../../types";
import api from "./api";
import { RemoteLiveAppProvider, useRemoteLiveAppContext, useRemoteLiveAppManifest } from "./index";

jest.mock("./api", () => ({
  __esModule: true,
  default: {
    fetchLiveAppManifests: jest.fn(),
  },
}));

jest.mock("../../../hooks/useIsMounted", () => {
  const isMounted = () => true;
  return {
    __esModule: true,
    default: () => isMounted,
  };
});

jest.mock("@features/platform-env", () => ({
  __esModule: true,
  default: () => "https://live-app-catalog.test",
}));

const manifest: LiveAppManifest = {
  id: "test-app",
  name: "Test App",
  private: false,
  url: "https://example.com",
  homepageUrl: "https://example.com",
  icon: "",
  platforms: ["desktop"],
  providerTestBaseUrl: "",
  providerTestId: "",
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: [],
  currencies: "*",
  content: {
    shortDescription: { en: "Test" },
    description: { en: "Test" },
  },
  permissions: [],
  domains: ["https://example.com"],
  visibility: "complete",
};

const cloneManifest = (value: LiveAppManifest): LiveAppManifest =>
  JSON.parse(JSON.stringify(value)) as LiveAppManifest;

// Well beyond any retry delay: no test here may rely on the periodic refresh.
const UPDATE_FREQUENCY = 30 * 60 * 1000;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RemoteLiveAppProvider
    parameters={{
      platform: "desktop",
      allowDebugApps: false,
      allowExperimentalApps: false,
      llVersion: "1.0.0",
    }}
    updateFrequency={UPDATE_FREQUENCY}
  >
    {children}
  </RemoteLiveAppProvider>
);

function Probe() {
  const { state } = useRemoteLiveAppContext();
  return (
    <>
      <div data-testid="ids">{Object.keys(state.value?.liveAppById ?? {}).join(",")}</div>
      <div data-testid="error">{state.error ? "has-error" : "no-error"}</div>
    </>
  );
}

describe("RemoteLiveAppProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("preserves unchanged manifest references and replaces changed manifests", async () => {
    let remoteManifest = manifest;
    jest
      .mocked(api.fetchLiveAppManifests)
      .mockImplementation(async () => [cloneManifest(remoteManifest)]);

    const { result } = renderHook(
      () => ({
        manifest: useRemoteLiveAppManifest(manifest.id),
        updateManifests: useRemoteLiveAppContext().updateManifests,
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.manifest).toBeDefined());
    const initialManifest = result.current.manifest;

    await act(() => result.current.updateManifests());

    expect(result.current.manifest).toBe(initialManifest);

    remoteManifest = { ...manifest, name: "Updated App" };
    await act(() => result.current.updateManifests());

    expect(result.current.manifest).not.toBe(initialManifest);
    expect(result.current.manifest?.name).toBe("Updated App");
  });

  it("should not pollute Object.prototype when a remote manifest id is __proto__", async () => {
    const protoManifest = { ...manifest, id: "__proto__" };
    jest.mocked(api.fetchLiveAppManifests).mockResolvedValue([protoManifest]);

    const { result } = renderHook(
      () => ({
        protoManifest: useRemoteLiveAppManifest("__proto__"),
        registry: useRemoteLiveAppContext().state.value,
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.protoManifest).toBeDefined());

    expect(result.current.protoManifest?.name).toBe("Test App");
    expect(Object.hasOwn(result.current.registry!.liveAppById, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(result.current.registry!.liveAppById)).toBeNull();
    expect(Object.prototype).not.toHaveProperty("id");
  });

  it("exposes the manifests when the catalog loads", async () => {
    jest.mocked(api.fetchLiveAppManifests).mockResolvedValue([manifest]);
    render(<Probe />, { wrapper });

    await waitFor(() => expect(screen.getByTestId("ids").textContent).toBe(manifest.id));
    expect(screen.getByTestId("error").textContent).toBe("no-error");
  });

  // Regression: a failed catalog fetch used to be stored as a *successful* empty
  // registry (error: null), so nothing could tell the catalog had never loaded.
  it("reports an error instead of a silently empty catalog when the fetch fails", async () => {
    jest.mocked(api.fetchLiveAppManifests).mockRejectedValue(new Error("Network Error"));
    render(<Probe />, { wrapper });

    await waitFor(() => expect(screen.getByTestId("error").textContent).toBe("has-error"));
    expect(screen.getByTestId("ids").textContent).toBe("");
  });

  // Regression: the only refetch was the `updateFrequency` interval (30 min in the
  // apps), so a transient failure at startup - e.g. the device network not being
  // up yet - left every live app unresolvable for the whole session.
  it("retries shortly after a failure instead of waiting for the next scheduled refresh", async () => {
    jest.useFakeTimers();
    jest
      .mocked(api.fetchLiveAppManifests)
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValue([manifest]);

    render(<Probe />, { wrapper });

    // Let the initial (failing) attempt settle.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByTestId("ids").textContent).toBe("");

    // Well under UPDATE_FREQUENCY: recovery must come from the retry, not the interval.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });

    expect(screen.getByTestId("ids").textContent).toBe(manifest.id);
    expect(screen.getByTestId("error").textContent).toBe("no-error");
  });
});
