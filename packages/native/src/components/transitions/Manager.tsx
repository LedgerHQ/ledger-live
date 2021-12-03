import { useState, useEffect, useRef, useMemo } from "react";
import { TransitionStatus } from "./index";

export interface Props {
  in: boolean;
  timeout: number;
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  children: (status: TransitionStatus) => JSX.Element | null;
}

/**
 * Mimics the [Transition](https://reactcommunity.org/react-transition-group/transition) component
 * from [react-transition-group](https://reactcommunity.org/react-transition-group).
 *
 * Supports a minimal set of options but works on react-native.
 */
export function TransitionManager({
  in: inValue,
  timeout,
  mountOnEnter,
  unmountOnExit,
  children,
}: Props) {
  const [status, setStatus] = useState<TransitionStatus>(
    inValue ? "entered" : "exited"
  );
  const canMount = useRef(!mountOnEnter);
  canMount.current = canMount.current || inValue;

  useEffect(() => {
    if (
      (inValue && status === "entered") ||
      (!inValue && status === "exited")
    ) {
      return;
    }
    const newStatus = inValue ? "entering" : "exiting";
    setStatus(newStatus);
    const timeoutRef = setTimeout(() => {
      setStatus(newStatus === "exiting" ? "exited" : "entered");
    }, timeout);
    return () => {
      clearTimeout(timeoutRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inValue, timeout]);

  const result = useMemo(() => {
    if (!canMount.current || (unmountOnExit && status === "exited")) {
      return null;
    }
    return children(status);
  }, [children, status, unmountOnExit]);

  return result;
}
