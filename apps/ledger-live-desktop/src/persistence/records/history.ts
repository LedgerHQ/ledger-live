import { defineRecord } from "@shared/persistence";
import type { State } from "~/renderer/reducers";
import { initHistory, type HistoryState } from "~/renderer/reducers/history";

export const historyRecord = defineRecord({
  key: "history",
  version: 0,
  schema: z => z.strictObject({ lastSeenOperationDate: z.string().nullable() }),
  codec: {
    encode: (history: HistoryState) => ({ lastSeenOperationDate: history.lastSeenOperationDate }),
    decode: stored => stored,
  },
  state: {
    select: (state: Pick<State, "history">) => state.history,
    toHydrationAction: initHistory,
  },
});
