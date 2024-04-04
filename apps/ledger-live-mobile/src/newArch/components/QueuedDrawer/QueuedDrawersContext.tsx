import React from "react";

/**
 * A function to call when the drawer should be opened or closed.
 * @param opened Whether the drawer should be opened or closed.
 */
export type SetDrawerOpenedCallback = (opened: boolean) => void;

/**
 * An object that represents a drawer in the queue.
 * It has methods to remove the drawer from the queue and get its position in the queue.
 */
export type DrawerInQueue = {
  removeDrawerFromQueue: () => void;
  getPositionInQueue: () => number;
};

type QueuedDrawersContextType = {
  /**
   * Add a drawer to the queue.
   * @param setDrawerOpenedCallback The callback to call when the drawer should be opened or closed.
   * @param force If true, the drawer will be opened immediately and all other drawers in the queue will be closed and removed from the queue.
   * @returns An object with methods to remove the drawer from the queue and get its position in the queue.
   */
  addDrawerToQueue: (
    setDrawerOpenedCallback: SetDrawerOpenedCallback,
    force: boolean,
  ) => DrawerInQueue;

  /**
   * Clear the drawer queue.
   * This should not be used except for debugging purposes.
   */
  _clearQueue(): void;
};

export const QueuedDrawersContext = React.createContext<QueuedDrawersContextType>({
  addDrawerToQueue: () => ({
    removeDrawerFromQueue: () => {},
    getPositionInQueue: () => -1,
  }),
  _clearQueue: () => {},
});
