/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { useDrawerConfiguration } from "../useDrawerConfiguration";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flag = (value: unknown) => mockUseFeature.mockReturnValue(value as any);

function renderCreate() {
  const { result } = renderHook(() => useDrawerConfiguration());
  return result.current.createDrawerConfiguration;
}

describe("useDrawerConfiguration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    flag(null);
  });

  it("reads the ptxEarnDrawerConfiguration flag", () => {
    renderHook(() => useDrawerConfiguration());

    expect(mockUseFeature).toHaveBeenCalledWith("ptxEarnDrawerConfiguration");
  });

  it("always returns both assets and networks, even with no input", () => {
    expect(renderCreate()(undefined, undefined)).toEqual({ assets: {}, networks: {} });
  });

  describe("earn use case comes from the feature flag", () => {
    it("uses the flag params when the flag is enabled", () => {
      flag({ enabled: true, params: { assets: { a: 1 }, networks: { n: 1 } } });

      expect(renderCreate()(undefined, "earn")).toEqual({
        assets: { a: 1 },
        networks: { n: 1 },
      });
    });

    it("ignores the params when the flag is disabled", () => {
      flag({ enabled: false, params: { assets: { a: 1 } } });

      expect(renderCreate()(undefined, "earn")).toEqual({ assets: {}, networks: {} });
    });

    it("tolerates an enabled flag with no params", () => {
      flag({ enabled: true });

      expect(renderCreate()(undefined, "earn")).toEqual({ assets: {}, networks: {} });
    });

    it("tolerates a missing flag", () => {
      flag(undefined);

      expect(renderCreate()(undefined, "earn")).toEqual({ assets: {}, networks: {} });
    });

    it("does not apply the earn config to another use case", () => {
      flag({ enabled: true, params: { assets: { a: 1 } } });

      expect(renderCreate()(undefined, "send")).toEqual({ assets: {}, networks: {} });
    });

    it("does not apply the earn config when no use case is given", () => {
      flag({ enabled: true, params: { assets: { a: 1 } } });

      expect(renderCreate()(undefined, undefined)).toEqual({ assets: {}, networks: {} });
    });
  });

  describe("precedence", () => {
    it("lets the explicit configuration win over the use-case config", () => {
      flag({ enabled: true, params: { assets: { shared: "from-flag", only: "flag" } } });

      expect(renderCreate()({ assets: { shared: "explicit" } }, "earn")).toEqual({
        assets: { shared: "explicit", only: "flag" },
        networks: {},
      });
    });

    it("lets a custom use-case config override the default earn config", () => {
      flag({ enabled: true, params: { assets: { a: "from-flag" } } });

      expect(renderCreate()(undefined, "earn", { earn: { assets: { a: "from-custom" } } })).toEqual(
        { assets: { a: "from-custom" }, networks: {} },
      );
    });

    it("supports custom use cases beyond earn", () => {
      expect(renderCreate()(undefined, "stake", { stake: { networks: { n: 1 } } })).toEqual({
        assets: {},
        networks: { n: 1 },
      });
    });

    it("merges assets and networks independently", () => {
      expect(
        renderCreate()({ networks: { n: "explicit" } }, "stake", {
          stake: { assets: { a: "use-case" } },
        }),
      ).toEqual({ assets: { a: "use-case" }, networks: { n: "explicit" } });
    });
  });

  it("returns a stable callback while the flag is unchanged", () => {
    const flagValue = { enabled: true, params: {} };
    flag(flagValue);

    const { result, rerender } = renderHook(() => useDrawerConfiguration());
    const first = result.current.createDrawerConfiguration;
    rerender();

    expect(result.current.createDrawerConfiguration).toBe(first);
  });
});
