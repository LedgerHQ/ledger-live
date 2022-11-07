// Thanks Dan Abramov
import { useRef, useEffect } from "react";
import noop from "lodash/noop";

const useInterval = (callback: () => void, delay: number) => {
  const savedCallback = useRef<() => void>(noop);
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  // Set up the interval.
  useEffect(() => {
    let id: NodeJS.Timeout;

    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      id = setInterval(tick, delay);
    }

    return () => {
      clearInterval(id);
    };
  }, [delay]);
};

export default useInterval;
