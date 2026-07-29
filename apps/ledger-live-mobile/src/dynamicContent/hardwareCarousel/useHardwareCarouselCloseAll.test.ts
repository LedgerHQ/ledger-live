import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { State } from "~/reducers/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { useHardwareCarouselCloseAll } from "./useHardwareCarouselCloseAll";
import { trackHardwareCarouselCloseAll } from "./analytics";

jest.mock("~/dynamicContent/useDynamicContent", () => ({
  __esModule: true,
  default: jest.fn(),
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
    } as ReturnType<typeof useDynamicContent>);
  });

  it("tracks analytics only when dismissCards dismisses at least one card", () => {
    mockDismissCards.mockReturnValue(true);
    const { result } = renderHook(() => useHardwareCarouselCloseAll(["card-1", "card-2"]), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoX]: true,
          },
          personalizedRecommendationsEnabled: true,
        },
      }),
    });

    act(() => {
      result.current();
    });

    expect(mockDismissCards).toHaveBeenCalledWith(["card-1", "card-2"]);
    expect(trackHardwareCarouselCloseAll).toHaveBeenCalledWith({
      deviceModel: "lnx",
      personalRecoOptIn: true,
      offerType: "discount",
      platform: "llm",
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
});
