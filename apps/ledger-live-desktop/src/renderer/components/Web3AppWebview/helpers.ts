import React, { MutableRefObject } from "react";

export function useCombinedRefs<T>(
  ...refs: (((instance: T | null) => void) | MutableRefObject<T | null> | null)[]
) {
  const targetRef = React.useRef<T>(null);

  React.useEffect(() => {
    refs.forEach(ref => {
      if (!ref) return;

      if (typeof ref === "function") {
        ref(targetRef.current);
      } else {
        ref.current = targetRef.current;
      }
    });
  }, [refs]);

  return targetRef;
}
