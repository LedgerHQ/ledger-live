import { documentedPayCardTransaction } from "@domain/api-card-management/mock/card-transactions";
import type { CardTransactionItem } from "../types";
import { groupCardHistoryItems } from "./groupCardHistoryItems";

function transactionItem(id: string, dateTime: string): CardTransactionItem {
  return {
    transaction: { ...documentedPayCardTransaction, id, dateTime },
    categoryLabel: "Other",
  };
}

describe("groupCardHistoryItems", () => {
  it("groups adjacent transactions by calendar day", () => {
    const firstDay = [
      transactionItem("first", "2026-09-16T12:00:00.000Z"),
      transactionItem("second", "2026-09-16T08:00:00.000Z"),
    ];
    const previousDay = transactionItem("third", "2026-09-15T18:00:00.000Z");

    const groups = groupCardHistoryItems([...firstDay, previousDay]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.items).toEqual(firstDay);
    expect(groups[1]?.items).toEqual([previousDay]);
  });

  it("preserves transactions with an unavailable date", () => {
    const item = transactionItem("invalid-date", "not-a-date");

    expect(groupCardHistoryItems([item])).toEqual([{ day: undefined, items: [item] }]);
  });
});
