import React, { createContext, type RefObject, useCallback, useEffect, useRef } from "react";
import { Dimensions, type View } from "react-native";

const IsInViewContext = createContext<IsInViewContext>({});

export function useIsInViewContext(
  target: RefObject<View>,
  onIsInViewUpdate: (entry: IsInViewEntry) => void,
) {
  const { addIsInViewItem } = React.useContext(IsInViewContext);
  const onIsInViewUpdateRef = useRef(onIsInViewUpdate);

  useEffect(() => {
    addIsInViewItem?.({ target, onIsInViewUpdate: onIsInViewUpdateRef.current });
  }, [target, onIsInViewUpdate, addIsInViewItem]);
}

export function IsInViewContextProvider({
  threshold = 0.5,
  interval: intervalDuration = 200,
  children,
}: IsInViewContextProviderProps) {
  const items = useRef<IsInViewItem[]>([]);
  const addIsInViewItem = useCallback((item: IsInViewItem) => items.current.push(item), []);

  const isInViewMap = useRef(new WeakMap<RefObject<View>, boolean>());

  useEffect(() => {
    const window = Dimensions.get("window");
    const interval = setInterval(() => {
      items.current.map(({ target, onIsInViewUpdate }) =>
        target.current?.measureInWindow((x, y, width, height) => {
          const inViewRatioX = ratioContained(x, width, window.width);
          const inViewRatioY = ratioContained(y, height, window.height);
          const inViewRatio = inViewRatioX * inViewRatioY;

          const isInView = inViewRatio > threshold;
          if (isInView === isInViewMap.current.get(target)) return;
          isInViewMap.current.set(target, isInView);

          const boundingClientRect = { x, y, width, height };
          onIsInViewUpdate({ isInView, inViewRatio, boundingClientRect });
        }),
      );
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [threshold, intervalDuration]);

  return (
    <IsInViewContext.Provider value={{ addIsInViewItem }}>{children}</IsInViewContext.Provider>
  );
}

type IsInViewContextProviderProps = {
  children: React.ReactNode;
  threshold?: number;
  interval?: number;
};

type IsInViewContext = {
  addIsInViewItem?: (items: IsInViewItem) => void;
};

type IsInViewItem = {
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
