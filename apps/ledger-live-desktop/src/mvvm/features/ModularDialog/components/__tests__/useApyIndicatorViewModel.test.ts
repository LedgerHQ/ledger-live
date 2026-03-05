import { renderHook } from "@testing-library/react";
import * as systemLocale from "~/helpers/systemLocale";
import * as getApyAppearanceModule from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { useApyIndicatorViewModel } from "../ApyIndicator/useApyIndicatorViewModel";

jest.mock("~/helpers/systemLocale");
jest.mock("@ledgerhq/live-common/modularDrawer/utils/getApyAppearance");

const mockGetParsedSystemDeviceLocale = jest.spyOn(systemLocale, "getParsedSystemDeviceLocale");
const mockGetApyAppearance = jest.spyOn(getApyAppearanceModule, "getApyAppearance");

describe("useApyIndicatorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns gray appearance for GB region", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "GB" });
    mockGetApyAppearance.mockReturnValue("gray");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(mockGetApyAppearance).toHaveBeenCalledWith("GB");
    expect(result.current.appearance).toBe("gray");
  });

  it("returns success appearance for US region", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "US" });
    mockGetApyAppearance.mockReturnValue("success");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(mockGetApyAppearance).toHaveBeenCalledWith("US");
    expect(result.current.appearance).toBe("success");
  });

  it("returns success appearance when region is null", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: null });
    mockGetApyAppearance.mockReturnValue("success");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(mockGetApyAppearance).toHaveBeenCalledWith(null);
    expect(result.current.appearance).toBe("success");
  });

  it("does not recompute appearance when region is unchanged across re-renders", () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "FR" });
    mockGetApyAppearance.mockReturnValue("success");

    const { rerender } = renderHook(() => useApyIndicatorViewModel());
    rerender();
    rerender();

    expect(mockGetApyAppearance).toHaveBeenCalledTimes(1);
  });
});
