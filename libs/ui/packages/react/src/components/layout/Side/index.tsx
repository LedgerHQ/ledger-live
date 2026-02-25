import React, { useRef, useCallback, useEffect, useState } from "react";
import { TransitionGroup } from "react-transition-group";
import Drawer from "../Drawer";
import TransitionSlide from "../../transitions/TransitionSlide";
import { useSide } from "./Provider";

export interface SideProps {
  onBack?: () => void;
}

export const SideWrapper = (props: SideProps): JSX.Element => {
  // Nb Note that it's not a real queue and we need to handle where we go from each _slide_
  const { state, setSide } = useSide();
  const [queue, setQueue] = useState<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Array<{ Component: React.ComponentType | null | undefined; props?: any; key: number }>
  >([]);
  const [direction, setDirection] = useState("left");
  const [transitionsEnabled, setTransitionsEnabled] = useState(false);
  const nonce = useRef(0);
  const onClose = useCallback(() => setSide(), [setSide]);

  useEffect(() => {
    setQueue(q => {
      if (!state.open || !state.Component) return [];
      return q.concat([{ ...state, key: nonce.current++ }]);
    });
  }, [state]);

  useEffect(() => {
    let timeout: number;

    if (queue.length > 1) {
      const [, ...rest] = queue;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore mismatch between nodejs and dom types
      timeout = setTimeout(() => {
        setQueue(rest);
        setDirection("left");
      }, 0);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [queue]);

  const wrappedOnBack = useCallback(() => {
    setDirection("right");
    const onBack = state?.props?.onBack;
    onBack && onBack();
  }, [state?.props]);

  return (
    <Drawer
      {...props}
      isOpen={!!state.open}
      onClose={onClose}
      onBack={state?.props?.onBack ? wrappedOnBack : undefined}
      setTransitionsEnabled={setTransitionsEnabled}
      hideNavigation={false}
    >
      <TransitionGroup enter={transitionsEnabled} exit={transitionsEnabled} component={null}>
        {queue.map(({ Component, props, key }) => (
          <TransitionSlide key={key} direction={direction}>
            {Component && <Component {...props} />}
          </TransitionSlide>
        ))}
      </TransitionGroup>
    </Drawer>
  );
};

export default SideWrapper;
