import React, { useContext, useCallback, useEffect, useState } from "react";
import { context, State } from "./Provider";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import styled from "styled-components";
import { Transition, TransitionGroup, TransitionStatus } from "react-transition-group";
import { useTrack } from "../analytics/segment";
const transitionStyles = {
  entering: {},
  entered: {
    transform: "translateX(0%)",
  },
  exiting: {
    opacity: 0,
    transform: "translateX(0%)",
  },
  exited: {
    opacity: 0,
  },
};
const DURATION = 200;
const Bar = styled.div.attrs<{ state: TransitionStatus; withPaddingTop: boolean }>(props => ({
  style: {
    ...transitionStyles[props.state as keyof typeof transitionStyles],
  },
}))<{ state: TransitionStatus; index: number; withPaddingTop: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${p => p.index};
  transform: translateX(${p => (p.index === 0 ? 0 : 100)}%);
  transition: all ${DURATION}ms ease-in-out, padding none;
  will-change: transform;
  background-color: ${p => p.theme.colors.palette.background.paper};
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.03);
  padding: ${p => (p.withPaddingTop ? "62px 0px 15px 0px" : "0px 0px 15px 0px")};
  overflow-x: hidden;
  overflow-y: auto;
`;
export const Drawer = () => {
  const { state, setDrawer } = useContext(context);
  const [queue, setQueue] = useState<State[]>([]);
  useEffect(() => {
    setQueue(q => {
      if (!state.open) return [];
      if (state.Component) return q.concat([state]);
      return q;
    });
  }, [state]);
  useEffect(() => {
    let t: NodeJS.Timeout | undefined;
    if (queue.length > 1) {
      const [, ...rest] = queue;
      t = setTimeout(() => setQueue(rest), DURATION * 2);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [queue]);
  const track = useTrack();
  const onRequestClose = useCallback(() => {
    track("button_clicked", { button: "Close" });
    setDrawer();
  }, [setDrawer, track]);
  return (
    <SideDrawer
      isOpen={!!state.open}
      onRequestClose={onRequestClose}
      onRequestBack={state?.props?.onRequestBack}
      direction="left"
      {...state.options}
    >
      <>
        <TransitionGroup>
          {queue.map(({ Component, props }, index) => (
            <Transition
              timeout={{
                appear: DURATION,
                enter: DURATION,
                exit: DURATION * 2,
              }}
              key={index}
            >
              {s => (
                <Bar
                  state={s}
                  index={index}
                  withPaddingTop={
                    state.options.withPaddingTop === undefined ? true : state.options.withPaddingTop
                  }
                >
                  {Component && (
                    <Component
                      onClose={state.options.onRequestClose || onRequestClose}
                      {...props}
                    />
                  )}
                </Bar>
              )}
            </Transition>
          ))}
        </TransitionGroup>
      </>
    </SideDrawer>
  );
};
export default Drawer;
