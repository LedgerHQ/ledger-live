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
import { concatMap, from, interval } from "rxjs";
import type { InViewOptions, InViewContext, InViewEntry, WatchedItem } from "./types";
import { inViewStatus } from "./utils";

const InViewContext = createContext<InViewContext>({});

export function useInViewContext(
  onInViewUpdate: (entry: InViewEntry) => void,
  deps: DependencyList = [],
  target: RefObject<View>,
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
    const observer = interval(intervalDuration).pipe(
      concatMap(() =>
        from(
          Promise.all(
            items.current.map(async item => {
              const threshold = watchedItem.current.get(item)
                ? outOfViewThreshold
                : inViewThreshold;

              const entry = await inViewStatus(item.target, threshold, window);
              return { item, entry };
            }),
          ),
        ),
      ),
    );

    const subscription = observer.subscribe(res => {
      res.forEach(({ item, entry }) => {
        if (entry.isInView === watchedItem.current.get(item)) return;
        watchedItem.current.set(item, entry.isInView);
        item.onInViewUpdate(entry);
      });
    });
    return () => subscription.unsubscribe();
  }, [hasItems, inViewThreshold, outOfViewThreshold, intervalDuration]);

  return (
    <InViewContext.Provider value={{ addWatchedItem, removeWatchedItem }}>
      {children}
    </InViewContext.Provider>
  );
}
