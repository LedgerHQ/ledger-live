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
        queueRef.current.forEach(queueItem => queueItem.setDrawerOpenedCallback(false));
        queueRef.current = [{ ...queueRef.current[0], markedForClose: true }, newQueueItem];
        // not opening the drawer here, it will be opened when the first item of the queue clears
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
        // remove from queue
        queueRef.current = queueRef.current.filter(queueItem => queueItem.id !== id);
        const nextInQueueNotMarkedForClose = queueRef.current.find(
          queueItem => !queueItem.markedForClose,
        );
        if (nextInQueueNotMarkedForClose) {
          logDrawer("removeDrawerFromQueue -> post close: open next in queue", {
            id: nextInQueueNotMarkedForClose.id,
          });
          nextInQueueNotMarkedForClose.setDrawerOpenedCallback(true);
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
    queueRef.current.forEach(queueItem => queueItem.setDrawerOpenedCallback(false));
    queueRef.current = [{ ...queueRef.current[0], markedForClose: true }];
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
