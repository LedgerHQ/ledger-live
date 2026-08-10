import React from "react";
import { defaultQueuedBottomSheetAdapters, type QueuedBottomSheetAdapters } from "../adapters";

const QueuedBottomSheetAdaptersContext = React.createContext<QueuedBottomSheetAdapters>(
  defaultQueuedBottomSheetAdapters,
);

export const QueuedBottomSheetAdaptersProvider = QueuedBottomSheetAdaptersContext.Provider;

export function useQueuedBottomSheetAdapters(): QueuedBottomSheetAdapters {
  return React.useContext(QueuedBottomSheetAdaptersContext);
}
