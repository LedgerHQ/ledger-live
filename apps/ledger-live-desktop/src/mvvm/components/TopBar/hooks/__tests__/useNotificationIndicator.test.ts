import { Bell, BellNotification } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useNotificationIndicator } from "../useNotificationIndicator";

jest.mock("~/renderer/hooks/useUnseenNotificationsCount", () => ({
  useUnseenNotificationsCount: jest.fn(() => 0),
}));

const mockUseUnseenNotificationsCount = jest.requireMock(
  "~/renderer/hooks/useUnseenNotificationsCount",
).useUnseenNotificationsCount;

describe("useNotificationIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUnseenNotificationsCount.mockReturnValue(0);
  });

  it("returns tooltip, onClick, icon (Bell when no unseen), isInteractive true", () => {
    const { result } = renderHook(() => useNotificationIndicator());

    expect(result.current.tooltip).toBeDefined();
    expect(result.current.onClick).toBeDefined();
    expect(result.current.icon).toBe(Bell);
    expect(result.current.isInteractive).toBe(true);
  });

  it("returns BellNotification icon when there are unseen notifications", () => {
    mockUseUnseenNotificationsCount.mockReturnValue(3);
    const { result } = renderHook(() => useNotificationIndicator());

    expect(result.current.icon).toBe(BellNotification);
  });

  it("onClick dispatches openInformationCenter and tracks button_clicked2", () => {
    const { result, store } = renderHook(() => useNotificationIndicator());
    const { track } = jest.requireMock("~/renderer/analytics/segment");

    act(() => {
      result.current.onClick();
    });

    expect(store.getState().UI.informationCenter.isOpen).toBe(true);
    expect(track).toHaveBeenCalledWith(
      "button_clicked2",
      expect.objectContaining({
        button: "Notification Center",
      }),
    );
  });
});
