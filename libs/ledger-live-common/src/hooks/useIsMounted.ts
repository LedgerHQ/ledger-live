import { useCallback, useEffect, useRef } from "react";

// Stateless hook that returns a function which, when called, indicates if the component
// using the hook is currently mounted or not
const useIsMounted = () => {
  const mountedRef = useRef(false);
  const isMounted = useCallback(() => mountedRef.current, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return isMounted;
};

export default useIsMounted;
