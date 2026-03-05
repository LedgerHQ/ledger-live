import { renderHook } from "@testing-library/react-native";
import * as getApyAppearanceModule from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import * as getStakeLabelLocaleBased from "~/helpers/getStakeLabelLocaleBased";
import { useApyIndicatorViewModel } from "../useApyIndicatorViewModel";

jest.mock("~/helpers/getStakeLabelLocaleBased");
jest.mock("@ledgerhq/live-common/modularDrawer/utils/getApyAppearance");

const mockGetCountryLocale = jest.spyOn(getStakeLabelLocaleBased, "getCountryLocale");
const mockGetApyAppearance = jest.spyOn(getApyAppearanceModule, "getApyAppearance");

describe("useApyIndicatorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns gray appearance for GB region", () => {
    mockGetCountryLocale.mockReturnValue("GB");
    mockGetApyAppearance.mockReturnValue("gray");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(mockGetCountryLocale).toHaveBeenCalled();
    expect(mockGetApyAppearance).toHaveBeenCalledWith("GB");
    expect(result.current.appearance).toBe("gray");
  });

  it("returns success appearance for US region", () => {
    mockGetCountryLocale.mockReturnValue("US");
    mockGetApyAppearance.mockReturnValue("success");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(mockGetApyAppearance).toHaveBeenCalledWith("US");
    expect(result.current.appearance).toBe("success");
  });

  it("returns success appearance for FR region", () => {
    mockGetCountryLocale.mockReturnValue("FR");
    mockGetApyAppearance.mockReturnValue("success");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(mockGetApyAppearance).toHaveBeenCalledWith("FR");
    expect(result.current.appearance).toBe("success");
  });

  it("does not recompute appearance when region is unchanged across re-renders", () => {
    mockGetCountryLocale.mockReturnValue("DE");
    mockGetApyAppearance.mockReturnValue("success");

    const { rerender } = renderHook(() => useApyIndicatorViewModel());
    rerender({});
    rerender({});

    expect(mockGetApyAppearance).toHaveBeenCalledTimes(1);
  });
});
