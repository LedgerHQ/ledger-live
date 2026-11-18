import { track, trackPage } from "@shared/analytics";
import { act, renderHook } from "../../__tests__/render";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/analyticsTypes";
import { useBootloaderDiscoveredViewModel } from "./useBootloaderDiscoveredViewModel";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
  trackPage: jest.fn(),
}));

const onContinue = jest.fn();
const props = { analyticsModelId: "stax", wired: false, onContinue };
const shared = {
  platform: "lwm",
  modelId: "stax",
  transport: "ble",
  mode: "bootloaderRepair",
};

describe("useBootloaderDiscoveredViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not track the page again when rerendered with an equivalent device", () => {
    let currentProps = props;
    const { rerender } = renderHook(() => useBootloaderDiscoveredViewModel(currentProps));

    currentProps = { ...props };
    rerender({});

    expect(trackPage).toHaveBeenCalledTimes(1);
  });

  it("tracks the bootloader page, then opens the repair on continue", () => {
    const { result } = renderHook(() => useBootloaderDiscoveredViewModel(props));

    expect(trackPage).toHaveBeenCalledWith({
      category: OsUpdatePage.BOOTLOADER_DETECTED,
      props: shared,
    });

    act(() => result.current.onContinue());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: OsUpdateButton.CONTINUE,
      page: OsUpdatePage.BOOTLOADER_DETECTED,
      ...shared,
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
