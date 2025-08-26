import React, {
  createContext,
  DependencyList,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Dimensions, type View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { concatMap, from, interval } from "rxjs";
import { inViewSetHasItems } from "~/actions/inView";
import { inViewHasItemsSelector } from "~/reducers/inView";
import type { InViewContext, InViewEntry, InViewOptions, WatchedItem } from "./types";
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

export function InViewProvider({
  inViewThreshold = 0.5,
  outOfViewThreshold = 0,
  interval: intervalDuration = 200,
  children,
}: InViewOptions & { children: ReactNode }) {
  const dispatch = useDispatch();

  const items = useRef<WatchedItem[]>([]);
  const hasItems = useSelector(inViewHasItemsSelector);

  const addWatchedItem = useCallback(
    (item: WatchedItem) => {
      if (items.current.length === 0) dispatch(inViewSetHasItems(true));
      items.current.push(item);
    },
    [dispatch],
  );
  const removeWatchedItem = useCallback(
    (item: WatchedItem) => {
      const index = items.current.indexOf(item);
      if (index === -1) return;
      items.current.splice(index, 1);
      if (items.current.length === 0) dispatch(inViewSetHasItems(false));
    },
    [dispatch],
  );

  const watchedItem = useRef(new WeakMap<WatchedItem, boolean>());

  useEffect(() => {
    if (!hasItems) return;

    const window = Dimensions.get("window");
    const subscription = interval(intervalDuration)
      .pipe(
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
      )
      .subscribe(xs => {
        xs.forEach(({ item, entry }) => {
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
