import type { CardTransactionItem } from "../types";
import { parseCardTransactionDate } from "../CardTransactions/components/ListItem/formatCardTransactionItem";

export type CardHistoryDayGroup = Readonly<{
  day?: Date;
  items: readonly CardTransactionItem[];
}>;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function groupCardHistoryItems(
  items: readonly CardTransactionItem[],
): readonly CardHistoryDayGroup[] {
  const groups: CardHistoryDayGroup[] = [];
  let currentKey: string | undefined;

  for (const item of items) {
    const parsed = parseCardTransactionDate(item.transaction.dateTime);
    const day = parsed ? startOfDay(parsed) : undefined;
    const dayKey = day?.toISOString() ?? "unknown";

    if (dayKey !== currentKey) {
      groups.push({ day, items: [item] });
      currentKey = dayKey;
    } else {
      const current = groups[groups.length - 1];
      if (!current) continue;
      groups[groups.length - 1] = { day: current.day, items: [...current.items, item] };
    }
  }

  return groups;
}
