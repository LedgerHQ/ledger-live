import { getOldCampaignIds, generateAnonymousId } from "./anonymousUsers";

const millisecondsInAMonth = 30 * 24 * 60 * 60 * 1000;

describe("anonymousUsers", () => {
  test("generateAnonymousId should returns an id", () => {
    expect(generateAnonymousId()).toMatch(/anonymous_id_\d+/);
  });
  test("getOldCampaignIds should return old ids", () => {
    const campaigns = {
      "1": Date.now() - 2 * millisecondsInAMonth,
      "2": Date.now() - 4 * millisecondsInAMonth,
    };
    expect(getOldCampaignIds(campaigns)).toEqual(["2"]);
  });
  test("getOldCampaignIds should return empty array", () => {
    const campaigns = {
      "1": Date.now() - 2 * millisecondsInAMonth,
      "2": Date.now() - 1 * millisecondsInAMonth,
    };
    expect(getOldCampaignIds(campaigns)).toEqual([]);
  });
  test("getOldCampaignIds should not return an id", () => {
    const campaigns = {
      "1": Date.now(),
      "2": Date.now(),
    };
    expect(getOldCampaignIds(campaigns)).toEqual([]);
  });
});
