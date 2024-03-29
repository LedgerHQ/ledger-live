import React from "react";

export type SetDrawerOpenedCallback = (opened: boolean) => void;
type RemoveDrawerFromQueueCallback = () => void;
type QueuedDrawersContextType = {
  addDrawerToQueue: (
    setDrawerOpenedCallback: SetDrawerOpenedCallback,
    force: boolean,
  ) => RemoveDrawerFromQueueCallback;
  _clearQueue(): void;
};
export const QueuedDrawersContext = React.createContext<QueuedDrawersContextType>({
  addDrawerToQueue: () => () => {},
  _clearQueue: () => {},
});
