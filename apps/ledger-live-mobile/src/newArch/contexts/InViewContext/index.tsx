import React, {
  createContext,
  DependencyList,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dimensions, type View } from "react-native";
import type { InViewOptions, InViewContext, InViewEntry, WatchedItem } from "./types";
import { inViewStatus } from "./utils";

const InViewContext = createContext<InViewContext>({});

export function useInViewContext(
  target: RefObject<View>,
  onInViewUpdate: (entry: InViewEntry) => void,
  deps: DependencyList = [],
) {
  const { addWatchedItem, removeWatchedItem } = useContext(InViewContext);
  const onInViewUpdateCb = useCallback(onInViewUpdate, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const item = { target, onInViewUpdate: onInViewUpdateCb };
    addWatchedItem?.(item);
    return () => removeWatchedItem?.(item);
  }, [target, onInViewUpdateCb, addWatchedItem, removeWatchedItem]);
}

export function InViewContextProvider({
  inViewThreshold = 0.5,
  outOfViewThreshold = 0,
  interval: intervalDuration = 200,
  children,
}: InViewOptions & { children: ReactNode }) {
  const items = useRef<WatchedItem[]>([]);
  const [hasItems, setHasItems] = useState(false);

  const addWatchedItem = useCallback((item: WatchedItem) => {
    if (items.current.length === 0) setHasItems(true);
    items.current.push(item);
  }, []);
  const removeWatchedItem = useCallback((item: WatchedItem) => {
    const index = items.current.indexOf(item);
    if (index === -1) return;
    items.current.splice(index, 1);
    if (items.current.length === 0) setHasItems(false);
  }, []);

  const watchedItem = useRef(new WeakMap<WatchedItem, boolean>());

  useEffect(() => {
    if (!hasItems) return;

    const window = Dimensions.get("window");
    const interval = setInterval(() => {
      items.current.forEach(async item => {
        const wasInView = watchedItem.current.get(item);
        const threshold = wasInView ? outOfViewThreshold : inViewThreshold;
        const entry = await inViewStatus(item.target, threshold, window);
        if (entry.isInView === wasInView) return;
        watchedItem.current.set(item, entry.isInView);
        item.onInViewUpdate(entry);
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [hasItems, inViewThreshold, outOfViewThreshold, intervalDuration]);

  return (
    <InViewContext.Provider value={{ addWatchedItem, removeWatchedItem }}>
      {children}
    </InViewContext.Provider>
  );
}
