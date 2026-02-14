import type { RefObject } from "react";
import type { View } from "react-native";

export type InViewOptions = {
  intervalDuration?: number;
  inViewThreshold?: number;
  outOfViewThreshold?: number;
};

export type InViewContext = {
  addWatchedItem?: (items: WatchedItem) => void;
  removeWatchedItem?: (items: WatchedItem) => void;
};

export type WatchedItem = {
  onInViewUpdate: (entry: InViewEntry) => void;
  target: RefObject<View | null>;
};

export type InViewEntry = {
  boundingClientRect: { x: number; y: number; width: number; height: number };
  isInView: boolean;
  progressRatio: number;
};
