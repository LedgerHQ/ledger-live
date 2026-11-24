import { defineRecord, recordVersions } from "@shared/persistence";
import { initHistory, type HistoryState } from "~/reducers/historySlice";
import type { State } from "~/reducers/types";

export const historyVersions = recordVersions(z =>
  z.strictObject({ lastSeenOperationDate: z.string().nullable() }),
);

export const historyRecord = defineRecord({
  key: "history",
  versions: historyVersions,
  codec: {
    encode: (history: HistoryState) => ({ lastSeenOperationDate: history.lastSeenOperationDate }),
    decode: stored => stored,
  },
  state: {
    select: (state: Pick<State, "history">) => state.history,
    toHydrationAction: initHistory,
  },
});
