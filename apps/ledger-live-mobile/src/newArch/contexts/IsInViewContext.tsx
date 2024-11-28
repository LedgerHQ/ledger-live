import React, {
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dimensions, type View } from "react-native";

const IsInViewContext = createContext<IsInViewContext>({});

export function useIsInViewContext(
  target: RefObject<View>,
  onIsInViewUpdate: (entry: IsInViewEntry) => void,
) {
  const { addWatchedItem, removeWatchedItem } = useContext(IsInViewContext);
  const onIsInViewUpdateRef = useRef(onIsInViewUpdate);

  useEffect(() => {
    const item = { target, onIsInViewUpdate: onIsInViewUpdateRef.current };
    addWatchedItem?.(item);
    return () => removeWatchedItem?.(item);
  }, [target, addWatchedItem, removeWatchedItem]);
}

export function IsInViewContextProvider({
  threshold = 0.5,
  interval: intervalDuration = 200,
  children,
}: IsInViewContextProviderProps) {
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
      items.current.forEach(item =>
        item.target.current?.measureInWindow((x, y, width, height) => {
          const inViewRatioX = ratioContained(x, width, window.width);
          const inViewRatioY = ratioContained(y, height, window.height);
          const inViewRatio = inViewRatioX * inViewRatioY;

          const isInView = inViewRatio > threshold;
          if (isInView === watchedItem.current.get(item)) return;
          watchedItem.current.set(item, isInView);

          const boundingClientRect = { x, y, width, height };
          item.onIsInViewUpdate({ isInView, inViewRatio, boundingClientRect });
        }),
      );
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [hasItems, threshold, intervalDuration]);

  return (
    <IsInViewContext.Provider value={{ addWatchedItem, removeWatchedItem }}>
      {children}
    </IsInViewContext.Provider>
  );
}

type IsInViewContextProviderProps = {
  children: React.ReactNode;
  threshold?: number;
  interval?: number;
};

type IsInViewContext = {
  addWatchedItem?: (items: WatchedItem) => void;
  removeWatchedItem?: (items: WatchedItem) => void;
};

type WatchedItem = {
  target: RefObject<View>;
  onIsInViewUpdate: (entry: IsInViewEntry) => void;
};

type IsInViewEntry = {
  boundingClientRect: { x: number; y: number; width: number; height: number };
  inViewRatio: number;
  isInView: boolean;
};

function ratioContained(start: number, length: number, containerLength: number): number {
  const ratioMax = containerLength / length;
  const ratioBefore = 1 + start / length;
  const ratioAfter = (containerLength - start) / length;
  return Math.max(0, Math.min(1, ratioMax, ratioBefore, ratioAfter));
}
