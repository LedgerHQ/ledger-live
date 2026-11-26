import { track } from "@shared/analytics";
import { trackNotificationToggle } from "./tracking";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("trackNotificationToggle", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it.each([
    ["areNotificationsAllowed", "Toggle_Allow"],
    ["announcementsCategory", "Toggle_Announcements"],
    ["largeMoverCategory", "Toggle_Largemover"],
    ["transactionsAlertsCategory", "Toggle_Transactionsalerts"],
    ["totalMarketCap", "Toggle_Totalmarketcap"],
    ["topGainersLosers", "Toggle_Topgainerslosers"],
  ] as const)("sends the legacy toggle name for %s", (key, toggle) => {
    trackNotificationToggle(key, false);

    expect(track).toHaveBeenCalledWith("toggle_clicked", { toggle, enabled: false });
  });
});
