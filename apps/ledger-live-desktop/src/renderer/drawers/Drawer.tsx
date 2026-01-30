import React, { useContext, useCallback, useEffect, useState, useRef } from "react";
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
  transition:
    all ${DURATION}ms ease-in-out,
    padding none;
  will-change: transform;
  background-color: ${p => p.theme.colors.background.card};
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.03);
  padding: ${p => (p.withPaddingTop ? "62px 0px 15px 0px" : "10px 0px 15px 0px")};
  overflow-x: hidden;
  overflow-y: auto;
`;
const Drawer = () => {
  const { state, setDrawer } = useContext(context);
  const [queue, setQueue] = useState<State[]>([]);
  const [transitionKey, setTransitionKey] = useState<string>("initial");
  const wasOpenRef = useRef(false);
  const openCountRef = useRef(0);
  useEffect(() => {
    setQueue(q => {
      if (!state.open) return [];
      if (state.Component) return q.concat([state]);
      return q;
    });
  }, [state]);
  useEffect(() => {
    if (state.open && !wasOpenRef.current) {
      openCountRef.current += 1;
      setTransitionKey(state.id || `open-${openCountRef.current}`);
    }
    wasOpenRef.current = state.open;
  }, [state.open, state.id]);
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
    track("button_clicked2", { button: "Close" });
    if (state?.props?.onRequestClose) {
      onRequestClose();
    }
    setDrawer();
  }, [setDrawer, state?.props?.onRequestClose, track]);

  const refsMapRef = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());

  useEffect(() => {
    const refsMap = refsMapRef.current;
    const currentIds = new Set(queue.map(({ id }) => id));
    for (const [id] of refsMap) {
      if (!currentIds.has(id)) {
        refsMap.delete(id);
      }
    }
  }, [queue]);

  return (
    <SideDrawer
      isOpen={!!state.open}
      onRequestClose={onRequestClose}
      onRequestBack={state?.props?.onRequestBack}
      direction="left"
      {...state.options}
    >
      <>
        <TransitionGroup key={transitionKey}>
          {queue.map(({ Component, props, id }, index) => {
            const refsMap = refsMapRef.current;
            if (!refsMap.has(id)) {
              refsMap.set(id, React.createRef<HTMLDivElement>());
            }
            const nodeRef = refsMap.get(id)!;
            return (
              <Transition
                timeout={{
                  appear: DURATION,
                  enter: DURATION,
                  exit: DURATION * 2,
                }}
                key={id}
                nodeRef={nodeRef}
              >
                {s => (
                  <Bar
                    ref={nodeRef}
                    state={s}
                    index={index}
                    withPaddingTop={
                      state.options.withPaddingTop === undefined
                        ? true
                        : state.options.withPaddingTop
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
            );
          })}
        </TransitionGroup>
      </>
    </SideDrawer>
  );
};
export default Drawer;
