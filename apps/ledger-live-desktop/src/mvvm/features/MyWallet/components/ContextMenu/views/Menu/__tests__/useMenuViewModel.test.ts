import { act } from "react";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { useRecoverEntry } from "LLD/hooks/useRecoverEntry";
import { useContextMenu } from "../../../../ContextMenuContext";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../../../../constants";
import { useMenuViewModel } from "../useMenuViewModel";

const mockNavigateTo = jest.fn();
const mockClose = jest.fn();
const mockMarkRecoverSeen = jest.fn();
const mockOpenRecover = jest.fn();

jest.mock("../../../../ContextMenuContext", () => ({
  useContextMenu: jest.fn(),
}));

jest.mock("LLD/hooks/useRecoverEntry", () => ({
  useRecoverEntry: jest.fn(),
}));

const mockUseContextMenu = jest.mocked(useContextMenu);
const mockUseRecoverEntry = jest.mocked(useRecoverEntry);
const mockTrack = jest.mocked(track);

const backupHubEnabled = withFlagOverrides({ lwdBackupHub: { enabled: true } });

describe("useMenuViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContextMenu.mockReturnValue({
      close: mockClose,
      view: "myWallet",
      direction: "forward",
      navigateTo: mockNavigateTo,
      goBack: jest.fn(),
    });
    mockUseRecoverEntry.mockReturnValue({
      recoverFeature: null,
      hasClickedRecover: false,
      markRecoverSeen: mockMarkRecoverSeen,
      openRecover: mockOpenRecover,
    });
  });

  it("navigates to the Backup Hub and marks recover seen when the flag is enabled", () => {
    const { result } = renderHook(() => useMenuViewModel(), { initialState: backupHubEnabled });

    act(() => result.current.onRecoverClick());

    expect(mockMarkRecoverSeen).toHaveBeenCalledTimes(1);
    expect(mockNavigateTo).toHaveBeenCalledWith("backupHub");
    expect(mockOpenRecover).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.backup,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });

  it("opens recover and closes the menu when the flag is disabled", () => {
    const { result } = renderHook(() => useMenuViewModel());

    act(() => result.current.onRecoverClick());

    expect(mockOpenRecover).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });
});
