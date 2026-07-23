/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useDAppManifestCurrencyIds } from "../useDAppManifestCurrencyIds";
import { createAppManifest } from "../../logic/__tests__/testHelpers";
import type { AppManifest } from "../../types";

describe("useDAppManifestCurrencyIds", () => {
  it("returns an empty array when manifest has no dapp", () => {
    const manifest = createAppManifest();
    const { result } = renderHook(() => useDAppManifestCurrencyIds(manifest));

    expect(result.current).toEqual([]);
  });

  it("maps dapp network currencies", () => {
    const manifest = createAppManifest();
    manifest.dapp = {
      networks: [
        { currency: "ethereum", chainID: 1, nodeURL: "" },
        { currency: "polygon", chainID: 137, nodeURL: "" },
      ],
    } as AppManifest["dapp"];

    const { result } = renderHook(() => useDAppManifestCurrencyIds(manifest));

    expect(result.current).toEqual(["ethereum", "polygon"]);
  });

  it("returns an empty array when dapp has empty networks", () => {
    const manifest = createAppManifest();
    manifest.dapp = { networks: [] } as unknown as AppManifest["dapp"];

    const { result } = renderHook(() => useDAppManifestCurrencyIds(manifest));

    expect(result.current).toEqual([]);
  });

  it("memoizes while networks reference is stable", () => {
    const manifest = createAppManifest();
    manifest.dapp = {
      networks: [{ currency: "ethereum", chainID: 1, nodeURL: "" }],
    } as AppManifest["dapp"];

    const { result, rerender } = renderHook(() => useDAppManifestCurrencyIds(manifest));
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });
});
