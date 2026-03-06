import { renderHook } from "@testing-library/react";
import * as systemLocale from "~/helpers/systemLocale";
import * as getApyAppearanceModule from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { useApyIndicatorViewModel } from "../ApyIndicator/useApyIndicatorViewModel";

jest.mock("~/helpers/systemLocale");

const mockGetParsedSystemDeviceLocale = jest.spyOn(systemLocale, "getParsedSystemDeviceLocale");

describe("useApyIndicatorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns gray appearance for GB region", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "GB" });

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(result.current.appearance).toBe("gray");
  });

  it("returns success appearance for US region", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "US" });

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(result.current.appearance).toBe("success");
  });

  it("returns success appearance when region is null", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: null });

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(result.current.appearance).toBe("success");
  });

  it("does not recompute appearance when region is unchanged across re-renders", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "FR" });
    const spy = jest.spyOn(getApyAppearanceModule, "getApyAppearance");

    const { rerender } = renderHook(() => useApyIndicatorViewModel());
    rerender();
    rerender();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
