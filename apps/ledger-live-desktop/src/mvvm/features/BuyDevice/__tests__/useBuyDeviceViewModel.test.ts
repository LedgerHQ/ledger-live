import { renderHook } from "tests/testSetup";
import useBuyDeviceViewModel from "../useBuyDeviceViewModel";
import * as originFlow from "~/renderer/analytics/originFlow";
import * as segment from "~/renderer/analytics/segment";

const mockTrack = jest.mocked(segment.track);
const mockGetOriginFlow = jest.mocked(originFlow.getOriginFlow);

describe("useBuyDeviceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOriginFlow.mockReturnValue("Manager Dashboard");
  });

  it("tracks modal_shown with trigger from getOriginFlow when modal opens", () => {
    mockGetOriginFlow.mockReturnValue("Send Modal");

    renderHook(() => useBuyDeviceViewModel(), {
      initialState: {
        dialogs: { BUY_DEVICE: true },
        settings: { lastOnboardedDevice: null },
      },
    });

    expect(mockTrack).toHaveBeenCalledWith("modal_shown", {
      modal: "BuyDeviceModal",
      trigger: "Send Modal",
    });
  });
});
