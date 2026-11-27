import { getHiddenNotificationCategories } from "./hiddenNotificationCategories";

describe("getHiddenNotificationCategories", () => {
  it("hides the categories the remote config does not display", () => {
    expect(
      getHiddenNotificationCategories([
        { category: "announcementsCategory", displayed: true },
        { category: "largeMoverCategory", displayed: false },
        { category: "totalMarketCap" },
      ]),
    ).toEqual(["largeMoverCategory", "totalMarketCap"]);
  });

  it("hides nothing without a remote config", () => {
    expect(getHiddenNotificationCategories(undefined)).toEqual([]);
    expect(getHiddenNotificationCategories([])).toEqual([]);
  });

  it("keeps an empty name for an entry without category, as the legacy screen does", () => {
    expect(getHiddenNotificationCategories([null, { displayed: false }])).toEqual(["", ""]);
  });
});
