import { track, trackPage } from "@shared/analytics";
import { act, renderHook } from "../../__tests__/render";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/analyticsTypes";
import { useUpdateOnDesktopSheetViewModel } from "./useUpdateOnDesktopSheetViewModel";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
  trackPage: jest.fn(),
}));

const onClose = jest.fn();
const props = {
  isOpen: true,
  page: "portfolio",
  productName: "Ledger Nano X",
  analyticsModelId: "nanoX",
  wired: false,
  osVersionFrom: "2.2.3",
  osVersionTo: "2.5.0",
  onClose,
};
const shared = {
  platform: "lwm",
  modelId: "nanoX",
  transport: "ble",
  mode: "update",
  entryPage: "portfolio",
  osVersionFrom: "2.2.3",
  osVersionTo: "2.5.0",
};

describe("useUpdateOnDesktopSheetViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not track the page while the sheet is closed", () => {
    renderHook(() => useUpdateOnDesktopSheetViewModel({ ...props, isOpen: false }));

    expect(trackPage).not.toHaveBeenCalled();
  });

  it("tracks the page once the sheet opens", () => {
    renderHook(() => useUpdateOnDesktopSheetViewModel(props));

    expect(trackPage).toHaveBeenCalledTimes(1);
    expect(trackPage).toHaveBeenCalledWith({
      category: OsUpdatePage.UPDATE_ON_DESKTOP,
      props: shared,
    });
  });

  it("leaves the versions out of the events when they are unknown", () => {
    renderHook(() =>
      useUpdateOnDesktopSheetViewModel({
        ...props,
        osVersionFrom: undefined,
        osVersionTo: undefined,
      }),
    );

    expect(trackPage).toHaveBeenCalledWith({
      category: OsUpdatePage.UPDATE_ON_DESKTOP,
      props: {
        platform: "lwm",
        modelId: "nanoX",
        transport: "ble",
        mode: "update",
        entryPage: "portfolio",
      },
    });
  });

  it("tracks the click and closes on got it", () => {
    const { result } = renderHook(() => useUpdateOnDesktopSheetViewModel(props));

    act(() => result.current.onGotIt());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: OsUpdateButton.GOT_IT,
      page: OsUpdatePage.UPDATE_ON_DESKTOP,
      ...shared,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
