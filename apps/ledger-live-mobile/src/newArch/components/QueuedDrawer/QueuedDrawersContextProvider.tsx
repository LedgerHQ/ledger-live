import React, { useCallback, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";
import {
  OnDrawerStateChangedCallback,
  QueuedDrawersContext,
  DrawerInQueue,
} from "./QueuedDrawersContext";
import { logDrawer } from "./utils/logDrawer";

type QueueItem = {
  id: string;
  setDrawerOpenedCallback: OnDrawerStateChangedCallback;
  markedForClose?: boolean;
};
export type DrawersQueue = Array<QueueItem>;

const QueuedDrawersContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queueRef = useRef<DrawersQueue>([]);

  const logQueueLength = useCallback(() => {
    logDrawer("queue length", queueRef.current.length);
  }, []);

  const addDrawerToQueue = useCallback(
    (setDrawerOpenedCallback: OnDrawerStateChangedCallback, force: boolean): DrawerInQueue => {
      logDrawer("addDrawerToQueue", { previousQueueLength: queueRef.current.length, force });
      const id = uuid();
      const newQueueItem: QueueItem = { id, setDrawerOpenedCallback };

      if (queueRef.current.length === 0) {
        logDrawer("addDrawerToQueue -> open drawer (empty queue)", { id });
        queueRef.current = [newQueueItem];
        setDrawerOpenedCallback(true);
      } else if (force) {
        logDrawer("addDrawerToQueue -> force close opened & queued drawers, and clear queue", id);
        // 1. Store current queue before modifying
        const previousQueue = queueRef.current;
        // 2. Close the currently opened drawer (first in queue)
        if (previousQueue.length > 0) {
          previousQueue[0].setDrawerOpenedCallback(false);
        }
        // 3. Clear the queue except for the first item (which is closing)
        queueRef.current =
          previousQueue.length > 0
            ? [{ ...previousQueue[0], markedForClose: true }, newQueueItem]
            : [newQueueItem];
        // 4. Close all other queued drawers (which removes them from queue and resets their state)
        //    The forced drawer will open when the first (marked-for-close) item is removed from queue
        for (const queueItem of previousQueue.slice(1)) {
          queueItem.setDrawerOpenedCallback(false);
        }
      } else {
        logDrawer("addDrawerToQueue -> add to queue", { id });
        queueRef.current = [...queueRef.current, newQueueItem];
      }
      logQueueLength();

      function removeDrawerFromQueue() {
        logDrawer("removeDrawerFromQueue: drawer closed, remove from queue", {
          id,
          previousQueueLength: queueRef.current.length,
        });
        // 1. Remove from queue
        queueRef.current = queueRef.current.filter(queueItem => queueItem.id !== id);
        // 2. Clean up any remaining marked-for-close items first
        queueRef.current = queueRef.current.filter(queueItem => !queueItem.markedForClose);
        // 3. Find next drawer to open
        const nextInQueue = queueRef.current[0];

        if (nextInQueue) {
          logDrawer("removeDrawerFromQueue -> post close: open next in queue", {
            id: nextInQueue.id,
          });
          nextInQueue.setDrawerOpenedCallback(true);
        } else {
          logDrawer("removeDrawerFromQueue -> queue is now empty");
        }
        logQueueLength();
      }

      return {
        removeDrawerFromQueue,
        getPositionInQueue: () => queueRef.current.findIndex(queueItem => queueItem.id === id),
      };
    },
    [logQueueLength],
  );

  const closeAllDrawers = useCallback(() => {
    logDrawer("closeAllDrawers");
    if (queueRef.current.length === 0) return;
    // Close all drawers - their removeDrawerFromQueue will clean up the queue
    queueRef.current.forEach(queueItem => queueItem.setDrawerOpenedCallback(false));
    // Don't keep any items in queue - let removeDrawerFromQueue handle cleanup
    // The queue will be cleared as each drawer's cleanup runs
    logQueueLength();
  }, [logQueueLength]);

  const _clearQueueDIRTYDONOTUSE = useCallback(() => {
    queueRef.current = [];
    logDrawer("queue cleared");
  }, []);

  const contextValue = useMemo(
    () => ({
      addDrawerToQueue,
      closeAllDrawers,
      _clearQueueDIRTYDONOTUSE,
    }),
    [addDrawerToQueue, closeAllDrawers, _clearQueueDIRTYDONOTUSE],
  );

  return (
    <QueuedDrawersContext.Provider value={contextValue}>{children}</QueuedDrawersContext.Provider>
  );
};

export default QueuedDrawersContextProvider;
