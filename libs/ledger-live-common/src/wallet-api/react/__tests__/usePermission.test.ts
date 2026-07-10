/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { usePermission } from "../usePermission";
import { createAppManifest } from "../../logic/__tests__/testHelpers";

describe("usePermission", () => {
  it("returns methodIds from the manifest permissions", () => {
    const manifest = createAppManifest();
    manifest.permissions = ["account.list", "currency.list"];

    const { result } = renderHook(() => usePermission(manifest));

    expect(result.current).toEqual({ methodIds: ["account.list", "currency.list"] });
  });

  it("returns empty methodIds when manifest has no permissions", () => {
    const manifest = createAppManifest();
    manifest.permissions = [];

    const { result } = renderHook(() => usePermission(manifest));

    expect(result.current.methodIds).toEqual([]);
  });

  it("memoizes the result while the manifest reference is stable", () => {
    const manifest = createAppManifest();
    const { result, rerender } = renderHook(props => usePermission(props), {
      initialProps: manifest,
    });
    const first = result.current;

    rerender(manifest);
    expect(result.current).toBe(first);
  });

  it("recomputes when the manifest reference changes", () => {
    const { result, rerender } = renderHook(props => usePermission(props), {
      initialProps: createAppManifest("a"),
    });
    const first = result.current;

    rerender(createAppManifest("b"));
    expect(result.current).not.toBe(first);
  });
});
