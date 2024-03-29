import React from "react";

export type SetDrawerOpenedCallback = (opened: boolean) => void;

export type DrawerInQueue = {
  removeDrawerFromQueue: () => void;
  getPositionInQueue: () => number;
};

type QueuedDrawersContextType = {
  addDrawerToQueue: (
    setDrawerOpenedCallback: SetDrawerOpenedCallback,
    force: boolean,
  ) => DrawerInQueue;
  _clearQueue(): void;
};
export const QueuedDrawersContext = React.createContext<QueuedDrawersContextType>({
  addDrawerToQueue: () => ({
    removeDrawerFromQueue: () => {},
    getPositionInQueue: () => -1,
  }),
  _clearQueue: () => {},
});
