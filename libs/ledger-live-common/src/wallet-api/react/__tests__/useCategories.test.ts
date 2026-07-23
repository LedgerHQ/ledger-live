/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useCategories } from "../useCategories";
import { createAppManifest } from "../../logic/__tests__/testHelpers";
import type { AppManifest } from "../../types";

function manifestWithCategories(id: string, categories: string[]): AppManifest {
  const m = createAppManifest(id);
  m.categories = categories;
  return m;
}

describe("useCategories", () => {
  it("defaults selected to 'all'", () => {
    const { result } = renderHook(() => useCategories([]));
    expect(result.current.selected).toBe("all");
  });

  it("uses the provided initial category", () => {
    const { result } = renderHook(() => useCategories([], "defi"));
    expect(result.current.selected).toBe("defi");
  });

  it("falls back to 'all' when initialCategory is null", () => {
    const { result } = renderHook(() => useCategories([], null));
    expect(result.current.selected).toBe("all");
  });

  it("groups manifests by category and includes 'all'", () => {
    const manifests = [
      manifestWithCategories("1", ["defi"]),
      manifestWithCategories("2", ["defi", "nft"]),
    ];
    const { result } = renderHook(() => useCategories(manifests));

    expect(result.current.categories).toContain("all");
    expect(result.current.categories).toContain("defi");
    expect(result.current.categories).toContain("nft");
    expect(result.current.manifestsByCategories.get("all")).toHaveLength(2);
    expect(result.current.manifestsByCategories.get("defi")).toHaveLength(2);
    expect(result.current.manifestsByCategories.get("nft")).toHaveLength(1);
  });

  it("setSelected updates the selected category", () => {
    const { result } = renderHook(() => useCategories([]));

    act(() => {
      result.current.setSelected("nft");
    });

    expect(result.current.selected).toBe("nft");
  });

  it("reset returns selected to 'all'", () => {
    const { result } = renderHook(() => useCategories([], "defi"));
    expect(result.current.selected).toBe("defi");

    act(() => {
      result.current.reset();
    });

    expect(result.current.selected).toBe("all");
  });

  it("only has 'all' when manifests have no categories", () => {
    const manifests = [manifestWithCategories("1", [])];
    const { result } = renderHook(() => useCategories(manifests));

    expect(result.current.categories).toEqual(["all"]);
  });
});
