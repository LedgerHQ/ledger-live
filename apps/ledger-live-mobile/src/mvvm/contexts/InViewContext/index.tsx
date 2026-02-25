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
import { useSelector, useDispatch } from "~/context/hooks";
import { concatMap, from, interval } from "rxjs";
import { inViewSetHasItems } from "~/actions/inView";
import { inViewHasItemsSelector } from "~/reducers/inView";
import type { InViewContext, InViewEntry, InViewOptions, WatchedItem } from "./types";
import { inViewStatus } from "./utils";

const InViewContext = createContext<InViewContext>({});

export function useInViewContext(
  onInViewUpdate: (entry: InViewEntry) => void,
  deps: DependencyList = [],
  target: RefObject<View | null>,
) {
  const { addWatchedItem, removeWatchedItem } = useContext(InViewContext);
  const onInViewUpdateCb = useCallback(onInViewUpdate, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const item = { target, onInViewUpdate: onInViewUpdateCb };
    addWatchedItem?.(item);
    return () => removeWatchedItem?.(item);
  }, [target, onInViewUpdateCb, addWatchedItem, removeWatchedItem]);
}

function Effect({
  intervalDuration,
  inViewThreshold,
  itemsRef,
  outOfViewThreshold,
}: {
  intervalDuration: number;
  inViewThreshold: number;
  itemsRef: React.RefObject<WatchedItem[]>;
  outOfViewThreshold: number;
}) {
  const watchedItem = useRef(new WeakMap<WatchedItem, boolean>());

  const hasItems = useSelector(inViewHasItemsSelector);

  useEffect(() => {
    if (!hasItems) return;

    const window = Dimensions.get("window");
    const items = itemsRef.current;
    if (!items) return;

    const subscription = interval(intervalDuration)
      .pipe(
        concatMap(() =>
          from(
            Promise.all(
              items.map(async item => {
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
  }, [hasItems, inViewThreshold, outOfViewThreshold, intervalDuration, itemsRef]);

  return null;
}

export function InViewProvider({
  inViewThreshold = 0.5,
  outOfViewThreshold = 0,
  intervalDuration = 200,
  children,
}: InViewOptions & { children: ReactNode }) {
  const dispatch = useDispatch();

  const itemsRef = useRef<WatchedItem[]>([]);

  const addWatchedItem = useCallback(
    (item: WatchedItem) => {
      if (itemsRef.current.length === 0) {
        dispatch(inViewSetHasItems(true));
      }
      itemsRef.current.push(item);
    },
    [dispatch],
  );
  const removeWatchedItem = useCallback(
    (item: WatchedItem) => {
      const index = itemsRef.current.indexOf(item);
      if (index === -1) return;
      itemsRef.current.splice(index, 1);
      if (itemsRef.current.length === 0) {
        dispatch(inViewSetHasItems(false));
      }
    },
    [dispatch],
  );

  return (
    <InViewContext.Provider value={{ addWatchedItem, removeWatchedItem }}>
      <Effect
        intervalDuration={intervalDuration}
        inViewThreshold={inViewThreshold}
        itemsRef={itemsRef}
        outOfViewThreshold={outOfViewThreshold}
      />
      {children}
    </InViewContext.Provider>
  );
}
