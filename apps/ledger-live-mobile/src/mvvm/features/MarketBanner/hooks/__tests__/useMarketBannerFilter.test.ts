import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { useMarketBannerFilter } from "../useMarketBannerFilter";

jest.mock("~/analytics", () => ({ track: jest.fn() }));

describe("useMarketBannerFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defaults to the trending filter and a closed drawer", () => {
    const { result } = renderHook(() => useMarketBannerFilter());

    expect(result.current.filter).toBe("trending");
    expect(result.current.isOpen).toBe(false);
  });

  it("opens and closes the selection drawer", () => {
    const { result } = renderHook(() => useMarketBannerFilter());

    act(() => result.current.onOpen());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.onClose());
    expect(result.current.isOpen).toBe(false);
  });

  it("tracks the banner filter button when opened", () => {
    const { result } = renderHook(() => useMarketBannerFilter());

    act(() => result.current.onOpen());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Market Banner Filter",
      page: "Wallet",
      banner: "Market Banner",
    });
  });
});
