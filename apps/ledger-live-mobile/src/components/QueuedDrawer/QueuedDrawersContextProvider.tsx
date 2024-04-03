import React, { useCallback, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import {
  SetDrawerOpenedCallback,
  QueuedDrawersContext,
  DrawerInQueue,
} from "./QueuedDrawersContext";

type QueueItem = {
  id: string;
  setDrawerOpenedCallback: SetDrawerOpenedCallback;
  markedForClose?: boolean;
};
export type DrawersQueue = Array<QueueItem>;

export function logDrawer(
  message: string | number,
  data?: Record<string, unknown> | number | string,
) {
  if (getEnv("LOG_DRAWERS"))
    log("QueuedDrawer", typeof message === "number" ? message.toString() : message, data);
}

const QueuedDrawersContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queueRef = useRef<DrawersQueue>([]);

  const logQueueLength = useCallback(() => {
    logDrawer("queue length", queueRef.current.length);
  }, []);

  const addDrawerToQueue = useCallback(
    (setDrawerOpenedCallback: SetDrawerOpenedCallback, force: boolean): DrawerInQueue => {
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

  const contextValue = useMemo(
    () => ({
      addDrawerToQueue,
      _clearQueue: () => {
        queueRef.current = [];
        logDrawer("queue cleared");
      },
    }),
    [addDrawerToQueue],
  );

  return (
    <QueuedDrawersContext.Provider value={contextValue}>{children}</QueuedDrawersContext.Provider>
  );
};

export default QueuedDrawersContextProvider;
