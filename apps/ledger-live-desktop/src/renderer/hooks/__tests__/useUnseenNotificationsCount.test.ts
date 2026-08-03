import { renderHook } from "tests/testSetup";
import { LocationContentCard, type NotificationContentCard } from "~/types/dynamicContent";
import { useUnseenNotificationsCount } from "../useUnseenNotificationsCount";

jest.mock("LLD/features/LNSUpsell", () => ({
  useLNSUpsellBannerState: jest.fn(() => ({ isShown: false })),
}));

const mockUseLNSUpsellBannerState = jest.requireMock("LLD/features/LNSUpsell")
  .useLNSUpsellBannerState as jest.Mock;

const unreadNotif: NotificationContentCard = {
  id: "notif-1",
  title: "Title",
  description: "Description",
  cta: "CTA",
  viewed: false,
  created: new Date("2026-01-01"),
  location: LocationContentCard.NotificationCenter,
};

const readNotif: NotificationContentCard = { ...unreadNotif, id: "notif-2", viewed: true };

describe("useUnseenNotificationsCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLNSUpsellBannerState.mockReturnValue({ isShown: false });
  });

  it("should count unviewed notification cards", () => {
    const { result } = renderHook(() => useUnseenNotificationsCount(), {
      initialState: {
        dynamicContent: { notificationsCards: [unreadNotif, readNotif] },
        settings: { shareAnalytics: true, sharePersonalizedRecommandations: false },
      },
    });

    expect(result.current).toBe(1);
  });

  it("should include LNS upsell banner when shown and not yet read", () => {
    mockUseLNSUpsellBannerState.mockReturnValue({ isShown: true });

    const { result } = renderHook(() => useUnseenNotificationsCount(), {
      initialState: {
        dynamicContent: { notificationsCards: [] },
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: false,
          anonymousUserNotifications: {},
        },
      },
    });

    expect(result.current).toBe(1);
  });
});
