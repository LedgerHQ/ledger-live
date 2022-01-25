import { useState, useEffect, useRef, useMemo } from "react";
import { TransitionStatus } from "./index";

export interface Props {
  /**
   * Show the component. Triggers the enter or exit states.
   */
  in: boolean;
  /**
   * By default the child component is mounted immediately along with the parent Transition component.
   * If you want to "lazy mount" the component on the first in={true} you can set mountOnEnter.
   * After the first enter transition the component will stay mounted, even on "exited",
   * unless you also specify unmountOnExit.
   */
  mountOnEnter?: boolean;
  /**
   * By default the child component stays mounted after it reaches the 'exited' state.
   * Set unmountOnExit if you'd prefer to unmount the component after it finishes exiting.
   */
  unmountOnExit?: boolean;
  /**
   * Enable or disable enter transitions.
   */
  enter?: boolean;
  /**
   * Enable or disable exit transitions.
   */
  exit?: boolean;
  /**
   * The duration of the transition, in milliseconds.
   *
   * You may specify a single timeout for all transitions using a string or or individually using an object.
   */
  timeout: number | { enter?: number; exit?: number };
  /**
   * A function child can be used instead of a React element.
   * This function is called with the current transition status ('entering', 'entered', 'exiting', 'exited'),
   * which can be used to apply context specific props to a component.
   */
  children: (status: TransitionStatus) => JSX.Element | null;
}

/**
 * Mimics the [Transition](https://reactcommunity.org/react-transition-group/transition) component
 * from [react-transition-group](https://reactcommunity.org/react-transition-group).
 *
 * Supports a minimal set of options but works with react-native.
 */
export function Transition({
  in: inValue,
  timeout,
  mountOnEnter,
  unmountOnExit,
  enter = true,
  exit = true,
  children,
}: Props) {
  const [status, setStatus] = useState<TransitionStatus>(inValue ? "entered" : "exited");
  const canMount = useRef(!mountOnEnter);
  canMount.current = canMount.current || inValue;

  useEffect(() => {
    if ((inValue && status === "entered") || (!inValue && status === "exited")) {
      return;
    }

    if (inValue && !enter) {
      return setStatus("entered");
    }

    if (!inValue && !exit) {
      return setStatus("exited");
    }

    const timeoutValue =
      typeof timeout === "number" ? timeout : timeout[inValue ? "enter" : "exit"];
    setStatus(inValue ? "entering" : "exiting");
    const timeoutRef = setTimeout(() => {
      setStatus(inValue ? "entered" : "exited");
    }, timeoutValue);
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
