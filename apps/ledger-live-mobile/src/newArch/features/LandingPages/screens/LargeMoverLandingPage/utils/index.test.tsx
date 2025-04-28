import i18next from "i18next";
import { getTimeAgoCode } from ".";

jest.mock("i18next", () => ({
  t: jest.fn(),
}));

describe("getTimeAgoCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns seconds ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10 * 1000);

    (i18next.t as jest.Mock).mockReturnValue("10 seconds ago");

    const result = getTimeAgoCode(past);

    expect(i18next.t).toHaveBeenCalledWith("largeMover.timeAgo.seconds", { count: 10 });
    expect(result).toBe("10 seconds ago");
  });

  it("returns minutes ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 60 * 1000);

    (i18next.t as jest.Mock).mockReturnValue("5 minutes ago");

    const result = getTimeAgoCode(past);

    expect(i18next.t).toHaveBeenCalledWith("largeMover.timeAgo.minutes_plural", { count: 5 });
    expect(result).toBe("5 minutes ago");
  });

  it("returns 1 hour ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    (i18next.t as jest.Mock).mockReturnValue("1 hour ago");

    const result = getTimeAgoCode(past);

    expect(i18next.t).toHaveBeenCalledWith("largeMover.timeAgo.hours", { count: 1 });
    expect(result).toBe("1 hour ago");
  });

  it("returns days ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    (i18next.t as jest.Mock).mockReturnValue("3 days ago");

    const result = getTimeAgoCode(past);

    expect(i18next.t).toHaveBeenCalledWith("largeMover.timeAgo.days_plural", { count: 3 });
    expect(result).toBe("3 days ago");
  });

  it("returns months ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);

    (i18next.t as jest.Mock).mockReturnValue("3 months ago");

    const result = getTimeAgoCode(past);

    expect(i18next.t).toHaveBeenCalledWith("largeMover.timeAgo.months_plural", { count: 3 });
    expect(result).toBe("3 months ago");
  });

  it("returns years ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

    (i18next.t as jest.Mock).mockReturnValue("2 years ago");

    const result = getTimeAgoCode(past);

    expect(i18next.t).toHaveBeenCalledWith("largeMover.timeAgo.years_plural", { count: 2 });
    expect(result).toBe("2 years ago");
  });
});
