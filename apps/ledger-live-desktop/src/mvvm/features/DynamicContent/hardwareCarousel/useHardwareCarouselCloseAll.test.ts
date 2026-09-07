import { act, renderHook } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";

import { useDynamicContent } from "../hooks/useDynamicContent";
import { useHardwareCarouselCloseAll } from "./useHardwareCarouselCloseAll";
import { trackHardwareCarouselCloseAll } from "./analytics";

jest.mock("../hooks/useDynamicContent", () => ({
  useDynamicContent: jest.fn(),
}));

jest.mock("./analytics", () => ({
  trackHardwareCarouselCloseAll: jest.fn(),
}));

const mockDismissCards = jest.fn();
const mockUseDynamicContent = useDynamicContent as jest.MockedFunction<typeof useDynamicContent>;

describe("useHardwareCarouselCloseAll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDynamicContent.mockReturnValue({
      dismissCards: mockDismissCards,
    } as unknown as ReturnType<typeof useDynamicContent>);
  });

  it("tracks analytics only when dismissCards dismisses at least one card", () => {
    mockDismissCards.mockReturnValue(true);
    const { result } = renderHook(() => useHardwareCarouselCloseAll(["card-1", "card-2"]), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoX],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    act(() => {
      result.current();
    });

    expect(mockDismissCards).toHaveBeenCalledWith(["card-1", "card-2"]);
    expect(trackHardwareCarouselCloseAll).toHaveBeenCalledWith({
      deviceModel: "lnx",
      personalRecoOptIn: true,
      offerType: "discount",
      platform: "lwd",
    });
  });

  it("does not track analytics when every card was already dismissed", () => {
    mockDismissCards.mockReturnValue(false);
    const { result } = renderHook(() => useHardwareCarouselCloseAll(["card-1"]));

    act(() => {
      result.current();
    });

    expect(mockDismissCards).toHaveBeenCalledWith(["card-1"]);
    expect(trackHardwareCarouselCloseAll).not.toHaveBeenCalled();
  });

  it("does not track analytics when the user has no eligible device model", () => {
    mockDismissCards.mockReturnValue(true);
    const { result } = renderHook(() => useHardwareCarouselCloseAll(["card-1"]), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoS],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    act(() => {
      result.current();
    });

    expect(mockDismissCards).toHaveBeenCalledWith(["card-1"]);
    expect(trackHardwareCarouselCloseAll).not.toHaveBeenCalled();
  });
});
