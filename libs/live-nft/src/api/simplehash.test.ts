import { Filters, buildFilters } from "./simplehash";

const FILTERS: Record<string, string> = {
  [Filters.SPAM_LTE]: "threshold",
  [Filters.SPAM_GTE]: "threshold-gte",
  falseFilter: "false-threshold",
};

describe("buildFilters", () => {
  it("should return filters built correctly", () => {
    const expected = "&filters=spam_score__lte=40,spam_score__gte=30,falseFilter=12";

    const result = buildFilters(FILTERS, {
      threshold: "40",
      ["threshold-gte"]: "30",
      ["false-threshold"]: "12",
    });
    expect(result).toEqual(expected);
  });
});
