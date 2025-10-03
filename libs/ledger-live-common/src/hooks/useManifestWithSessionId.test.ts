/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useManifestWithSessionId } from "./useManifestWithSessionId";
import { LiveAppManifest } from "../platform/types";

const mockFetch = jest.fn();
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
global.fetch = mockFetch as any;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const baseManifest = {
  id: "test-app",
  name: "Test App",
  url: "https://example.com",
} as LiveAppManifest;

describe("useManifestWithSessionId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null manifest during loading", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ providerSessionId: "abc123" }),
    });

    const { result } = renderHook(() =>
      useManifestWithSessionId({ manifest: baseManifest, shareAnalytics: true }),
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.manifest).toBeNull();
  });

  it("returns manifest with externalID after success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ providerSessionId: "abc123" }),
    });

    const { result } = renderHook(() =>
      useManifestWithSessionId({ manifest: baseManifest, shareAnalytics: true }),
    );

    await waitFor(() =>
      expect(result.current.manifest).toEqual({
        ...baseManifest,
        url: "https://example.com/?externalID=abc123",
      }),
    );

    expect(result.current.loading).toBe(false);
  });

  it("falls back to original manifest if fetch rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() =>
      useManifestWithSessionId({ manifest: baseManifest, shareAnalytics: true }),
    );

    await waitFor(() => {
      expect(result.current.manifest).toEqual(baseManifest);
    });

    expect(result.current.loading).toBe(false);
  });

  it("falls back to original manifest if response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() =>
      useManifestWithSessionId({ manifest: baseManifest, shareAnalytics: true }),
    );

    await waitFor(() => {
      expect(result.current.manifest).toEqual(baseManifest);
    });

    expect(result.current.loading).toBe(false);
  });

  it("returns null if manifest is not provided", async () => {
    const { result } = renderHook(() =>
      useManifestWithSessionId({ manifest: null, shareAnalytics: true }),
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.manifest).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("skips fetch if shareAnalytics is false and just returns manifest", () => {
    const { result } = renderHook(() =>
      useManifestWithSessionId({ manifest: baseManifest, shareAnalytics: false }),
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.manifest).toEqual(baseManifest);
    expect(result.current.loading).toBe(false);
  });
});
