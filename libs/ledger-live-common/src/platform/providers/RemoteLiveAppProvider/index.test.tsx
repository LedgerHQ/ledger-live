/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
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

describe("RemoteLiveAppProvider", () => {
  it("preserves unchanged manifest references and replaces changed manifests", async () => {
    let remoteManifest = manifest;
    jest
      .mocked(api.fetchLiveAppManifests)
      .mockImplementation(async () => [cloneManifest(remoteManifest)]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RemoteLiveAppProvider
        parameters={{
          platform: "desktop",
          allowDebugApps: false,
          allowExperimentalApps: false,
          llVersion: "1.0.0",
        }}
        updateFrequency={60_000}
      >
        {children}
      </RemoteLiveAppProvider>
    );

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

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RemoteLiveAppProvider
        parameters={{
          platform: "desktop",
          allowDebugApps: false,
          allowExperimentalApps: false,
          llVersion: "1.0.0",
        }}
        updateFrequency={60_000}
      >
        {children}
      </RemoteLiveAppProvider>
    );

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
});
