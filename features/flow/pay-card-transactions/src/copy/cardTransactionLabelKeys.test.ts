import { categoryLabelKey, statusLabelKey } from "./cardTransactionLabelKeys";

describe("statusLabelKey", () => {
  it.each(["CONFIRMED", "PENDING", "DECLINED", "REVERTED"] as const)(
    "maps %s to its status wording key",
    status => {
      expect(statusLabelKey(status)).toBe(`payTab.cardTransactions.detail.statusValues.${status}`);
    },
  );
});

describe("categoryLabelKey", () => {
  it.each([
    "SUBSCRIPTIONS",
    "FOOD",
    "TRAVEL",
    "ENTERTAINMENT",
    "HEALTH",
    "ATM",
    "UTILITIES",
    "MISC",
  ] as const)("maps %s to its category wording key", category => {
    expect(categoryLabelKey(category)).toBe(`payTab.cardTransactions.categories.${category}`);
  });
});
