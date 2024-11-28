import React, {
  createContext,
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

const IsInViewContext = createContext<InViewContext>({});

export function useIsInViewContext(
  target: RefObject<View>,
  onIsInViewUpdate: (entry: InViewEntry) => void,
  { threshold = 0.5, interval: intervalDuration = 200 }: InViewOptions = {},
) {
  const { addWatchedItem, removeWatchedItem } = useContext(IsInViewContext);
  const onIsInViewUpdateRef = useRef(onIsInViewUpdate);
  const fallbackIsInViewRef = useRef(false);

  useEffect(() => {
    if (addWatchedItem && removeWatchedItem) {
      const item = { target, onIsInViewUpdate: onIsInViewUpdateRef.current };
      addWatchedItem?.(item);
      return () => removeWatchedItem?.(item);
    } else {
      // Fallback: Run the intervals individually if the context is not available
      const interval = setInterval(async () => {
        const entry = await inViewStatus(target, threshold, Dimensions.get("window"));
        if (entry.isInView === fallbackIsInViewRef.current) return;
        fallbackIsInViewRef.current = entry.isInView;
        onIsInViewUpdateRef.current(entry);
      }, intervalDuration);
      return () => clearInterval(interval);
    }
  }, [target, addWatchedItem, removeWatchedItem, intervalDuration, threshold]);
}

export function IsInViewContextProvider({
  threshold = 0.5,
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
        const entry = await inViewStatus(item.target, threshold, window);
        if (entry.isInView === watchedItem.current.get(item)) return;
        watchedItem.current.set(item, entry.isInView);
        item.onIsInViewUpdate(entry);
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [hasItems, threshold, intervalDuration]);

  return (
    <IsInViewContext.Provider value={{ addWatchedItem, removeWatchedItem }}>
      {children}
    </IsInViewContext.Provider>
  );
}
