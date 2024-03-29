import React, { useCallback, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";
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

const QueuedDrawersContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queueRef = useRef<DrawersQueue>([]);

  const logQueueLength = useCallback(() => {
    console.log("queue length", queueRef.current.length);
  }, []);

  const addDrawerToQueue = useCallback(
    (setDrawerOpenedCallback: SetDrawerOpenedCallback, force: boolean): DrawerInQueue => {
      console.log("addDrawerToQueue", queueRef.current.length, force);
      const id = uuid();
      const newQueueItem: QueueItem = { id, setDrawerOpenedCallback };
      if (queueRef.current.length === 0) {
        console.log("open drawer (empty queue)", id);
        queueRef.current = [newQueueItem];
        setDrawerOpenedCallback(true);
      } else if (force) {
        console.log("force close first drawer & clear queue", id);
        queueRef.current.forEach(queueItem => queueItem.setDrawerOpenedCallback(false));
        queueRef.current = [{ ...queueRef.current[0], markedForClose: true }, newQueueItem];
        // not opening the drawer here, it will be opened when the first item of the queue clears
      } else {
        console.log("add to queue", id);
        queueRef.current = [...queueRef.current, newQueueItem];
      }
      logQueueLength();

      function removeDrawerFromQueue() {
        console.log("drawer closed, remove from queue", id, queueRef.current.length);
        // remove from queue
        queueRef.current = queueRef.current.filter(queueItem => queueItem.id !== id);
        const nextInQueueNotMarkedForClose = queueRef.current.find(
          queueItem => !queueItem.markedForClose,
        );
        if (nextInQueueNotMarkedForClose) {
          console.log("post close: open next in queue", nextInQueueNotMarkedForClose.id);
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
        console.log("queue cleared");
      },
    }),
    [addDrawerToQueue],
  );

  return (
    <QueuedDrawersContext.Provider value={contextValue}>{children}</QueuedDrawersContext.Provider>
  );
};

export default QueuedDrawersContextProvider;
