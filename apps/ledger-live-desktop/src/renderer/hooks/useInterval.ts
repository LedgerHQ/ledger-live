// Thanks Dan Abramov
import { useRef, useEffect } from "react";
import noop from "lodash/noop";
type Callback = () => void;
const useInterval = (callback: Callback, delay: number) => {
  const savedCallback = useRef<Callback>(noop);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = window.setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
export default useInterval;
