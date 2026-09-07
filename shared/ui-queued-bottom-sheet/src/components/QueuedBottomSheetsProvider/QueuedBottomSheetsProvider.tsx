import React, { useCallback, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";
import {
  BottomSheetStateHandlers,
  QueuedBottomSheetsContext,
  BottomSheetInQueue,
} from "../../contexts/QueuedBottomSheetsContext";
import { type QueuedBottomSheetAdapters, defaultQueuedBottomSheetAdapters } from "../../adapters";
import { QueuedBottomSheetAdaptersProvider } from "../../internals/adaptersContext";

type QueueItem = {
  id: string;
  stateHandlers: BottomSheetStateHandlers;
  markedForClose?: boolean;
};

type Props = Readonly<{
  /** App-specific behaviour. Must be stable across renders. Defaults to a no-op set. */
  adapters?: QueuedBottomSheetAdapters;
  children: React.ReactNode;
}>;

export function QueuedBottomSheetsProvider({
  adapters = defaultQueuedBottomSheetAdapters,
  children,
}: Props) {
  const queueRef = useRef<QueueItem[]>([]);

  const logRef = useRef(adapters.log);
  logRef.current = adapters.log;
  const logBottomSheet = useCallback(
    (message: string, data?: Record<string, unknown> | number | string) =>
      logRef.current(message, data),
    [],
  );

  const logQueueLength = useCallback(() => {
    logBottomSheet("queue length", queueRef.current.length);
  }, [logBottomSheet]);

  const addBottomSheetToQueue = useCallback(
    (stateHandlers: BottomSheetStateHandlers, force: boolean): BottomSheetInQueue => {
      logBottomSheet("addBottomSheetToQueue", {
        previousQueueLength: queueRef.current.length,
        force,
      });
      const id = uuid();
      const newQueueItem: QueueItem = { id, stateHandlers };

      if (queueRef.current.length === 0) {
        logBottomSheet("addBottomSheetToQueue -> open drawer (empty queue)", { id });
        queueRef.current = [newQueueItem];
        stateHandlers.open();
      } else if (force) {
        logBottomSheet(
          "addBottomSheetToQueue -> force close opened & queued drawers, and clear queue",
          id,
        );
        const [openedItem, ...queuedItems] = queueRef.current;
        queueRef.current = openedItem
          ? [{ ...openedItem, markedForClose: true }, newQueueItem]
          : [newQueueItem];
        // The forced drawer opens once the first (marked-for-close) item is removed from the queue.
        openedItem?.stateHandlers.close();
        for (const queueItem of queuedItems) {
          queueItem.stateHandlers.close();
        }
      } else {
        logBottomSheet("addBottomSheetToQueue -> add to queue", { id });
        queueRef.current = [...queueRef.current, newQueueItem];
      }
      logQueueLength();

      function removeBottomSheetFromQueue() {
        logBottomSheet("removeBottomSheetFromQueue: drawer closed, remove from queue", {
          id,
          previousQueueLength: queueRef.current.length,
        });
        queueRef.current = queueRef.current.filter(queueItem => queueItem.id !== id);
        queueRef.current = queueRef.current.filter(queueItem => !queueItem.markedForClose);
        const nextInQueue = queueRef.current[0];

        if (nextInQueue) {
          logBottomSheet("removeBottomSheetFromQueue -> post close: open next in queue", {
            id: nextInQueue.id,
          });
          nextInQueue.stateHandlers.open();
        } else {
          logBottomSheet("removeBottomSheetFromQueue -> queue is now empty");
        }
        logQueueLength();
      }

      return {
        removeBottomSheetFromQueue,
        getPositionInQueue: () => queueRef.current.findIndex(queueItem => queueItem.id === id),
      };
    },
    [logBottomSheet, logQueueLength],
  );

  const closeAllBottomSheets = useCallback(() => {
    logBottomSheet("closeAllBottomSheets");
    if (queueRef.current.length === 0) return;
    queueRef.current.forEach(queueItem => {
      queueItem.markedForClose = true;
      queueItem.stateHandlers.close();
    });
    queueRef.current = [];
    logQueueLength();
  }, [logBottomSheet, logQueueLength]);

  const _clearQueueDIRTYDONOTUSE = useCallback(() => {
    queueRef.current = [];
    logBottomSheet("queue cleared");
  }, [logBottomSheet]);

  const contextValue = useMemo(
    () => ({
      addBottomSheetToQueue,
      closeAllBottomSheets,
      _clearQueueDIRTYDONOTUSE,
    }),
    [addBottomSheetToQueue, closeAllBottomSheets, _clearQueueDIRTYDONOTUSE],
  );

  return (
    <QueuedBottomSheetAdaptersProvider value={adapters}>
      <QueuedBottomSheetsContext.Provider value={contextValue}>
        {children}
      </QueuedBottomSheetsContext.Provider>
    </QueuedBottomSheetAdaptersProvider>
  );
}
