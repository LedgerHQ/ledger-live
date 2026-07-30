import { act, renderHook } from "tests/testSetup";
import { setNotificationsCards } from "~/renderer/actions/dynamicContent";
import { LocationContentCard, type NotificationContentCard } from "~/types/dynamicContent";
import { useMarkNotificationsAsReadOnOpen } from "../useMarkNotificationsAsReadOnOpen";

jest.mock("LLD/features/LNSUpsell", () => ({
  useLNSUpsellBannerState: jest.fn(() => ({ isShown: false })),
}));

const mockUseLNSUpsellBannerState = jest.requireMock("LLD/features/LNSUpsell")
  .useLNSUpsellBannerState as jest.Mock;

const NOTIF: NotificationContentCard = {
  id: "notif-1",
  title: "Update available",
  description: "Please update",
  cta: "Learn more",
  viewed: false,
  created: new Date("2026-01-01"),
  location: LocationContentCard.NotificationCenter,
};

describe("useMarkNotificationsAsReadOnOpen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLNSUpsellBannerState.mockReturnValue({ isShown: false });
  });

  it("should mark notification cards as viewed in Redux on mount", () => {
    const { store } = renderHook(() => useMarkNotificationsAsReadOnOpen(), {
      initialState: {
        dynamicContent: { notificationsCards: [NOTIF] },
        settings: { shareAnalytics: true, sharePersonalizedRecommandations: false },
      },
    });

    expect(store.getState().dynamicContent.notificationsCards[0]?.viewed).toBe(true);
  });

  it("should persist anonymous read state when tracking is disabled", () => {
    const { store } = renderHook(() => useMarkNotificationsAsReadOnOpen(), {
      initialState: {
        dynamicContent: { notificationsCards: [NOTIF] },
        settings: {
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
          anonymousUserNotifications: {},
        },
      },
    });

    expect(store.getState().settings.anonymousUserNotifications[NOTIF.id]).toEqual(
      expect.any(Number),
    );
  });

  it("should mark LNS upsell notification as read when shown in notification center", () => {
    mockUseLNSUpsellBannerState.mockReturnValue({ isShown: true });

    const { store } = renderHook(() => useMarkNotificationsAsReadOnOpen(), {
      initialState: {
        dynamicContent: { notificationsCards: [NOTIF] },
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: false,
          anonymousUserNotifications: {},
        },
      },
    });

    expect(store.getState().settings.anonymousUserNotifications.LNSUpsell).toEqual(
      expect.any(Number),
    );
  });

  it("should do nothing when there are no notification cards", () => {
    const { store } = renderHook(() => useMarkNotificationsAsReadOnOpen(), {
      initialState: {
        dynamicContent: { notificationsCards: [] },
        settings: { shareAnalytics: true, sharePersonalizedRecommandations: false },
      },
    });

    expect(store.getState().dynamicContent.notificationsCards).toEqual([]);
  });

  it("should mark cards as read when they arrive after mount", () => {
    const { store, rerender } = renderHook(() => useMarkNotificationsAsReadOnOpen(), {
      initialState: {
        dynamicContent: { notificationsCards: [] },
        settings: { shareAnalytics: true, sharePersonalizedRecommandations: false },
      },
    });

    expect(store.getState().dynamicContent.notificationsCards).toEqual([]);

    act(() => {
      store.dispatch(setNotificationsCards([NOTIF]));
    });
    rerender();

    expect(store.getState().dynamicContent.notificationsCards[0]?.viewed).toBe(true);
  });

  it("should not re-dispatch when all cards are already viewed", () => {
    const viewedNotif = { ...NOTIF, viewed: true };
    const { store, rerender } = renderHook(() => useMarkNotificationsAsReadOnOpen(), {
      initialState: {
        dynamicContent: { notificationsCards: [viewedNotif] },
        settings: { shareAnalytics: true, sharePersonalizedRecommandations: false },
      },
    });

    rerender();

    expect(store.getState().dynamicContent.notificationsCards[0]?.viewed).toBe(true);
  });
});
