import { renderHook } from "@testing-library/react-native";
import * as getApyAppearanceModule from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import * as getStakeLabelLocaleBased from "~/helpers/getStakeLabelLocaleBased";
import { useApyIndicatorViewModel } from "../useApyIndicatorViewModel";

jest.mock("~/helpers/getStakeLabelLocaleBased");

const mockGetCountryLocale = jest.spyOn(getStakeLabelLocaleBased, "getCountryLocale");

describe("useApyIndicatorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns gray appearance for GB region", () => {
    mockGetCountryLocale.mockReturnValue("GB");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(result.current.appearance).toBe("gray");
  });

  it("returns success appearance for US region", () => {
    mockGetCountryLocale.mockReturnValue("US");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(result.current.appearance).toBe("success");
  });

  it("returns success appearance for FR region", () => {
    mockGetCountryLocale.mockReturnValue("FR");

    const { result } = renderHook(() => useApyIndicatorViewModel());

    expect(result.current.appearance).toBe("success");
  });

  it("does not recompute appearance when region is unchanged across re-renders", () => {
    mockGetCountryLocale.mockReturnValue("DE");
    const spy = jest.spyOn(getApyAppearanceModule, "getApyAppearance");

    const { rerender } = renderHook(() => useApyIndicatorViewModel());
    rerender({});
    rerender({});

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
