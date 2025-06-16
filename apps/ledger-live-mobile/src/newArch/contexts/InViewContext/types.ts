import type { RefObject } from "react";
import type { View } from "react-native";

export type InViewOptions = {
  inViewThreshold?: number;
  outOfViewThreshold?: number;
  interval?: number;
};

export type InViewContext = {
  addWatchedItem?: (items: WatchedItem) => void;
  removeWatchedItem?: (items: WatchedItem) => void;
};

export type WatchedItem = {
  target: RefObject<View>;
  onInViewUpdate: (entry: InViewEntry) => void;
};

export type InViewEntry = {
  boundingClientRect: { x: number; y: number; width: number; height: number };
  progressRatio: number;
  isInView: boolean;
};
