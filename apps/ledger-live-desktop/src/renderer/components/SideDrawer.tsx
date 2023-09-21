import React, { useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { color } from "styled-system";
import { Transition, TransitionStatus } from "react-transition-group";
import { createFocusTrap, FocusTrap } from "focus-trap";
import { createPortal } from "react-dom";
import { modalsStateSelector } from "~/renderer/reducers/modals";
import { useDeviceBlocked } from "./DeviceAction/DeviceBlocker";
import SideDrawerHeader from "./SideDrawerHeader";

const DURATION = 250;
const transitionBackdropStyles = {
  entering: {},
  entered: {
    opacity: 1,
  },
  exiting: {
    pointerEvents: "none",
  },
  exited: {},
};
const DrawerBackdrop = styled.div.attrs(({ state }: { state: TransitionStatus }) => ({
  style: transitionBackdropStyles[state as keyof typeof transitionBackdropStyles],
}))<{ state: TransitionStatus }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.65);
  will-change: opacity;
  opacity: 0;
  transition: opacity ${DURATION}ms ease-out;
`;
const transitionStyles = {
  entering: {},
  entered: {
    transform: "translateX(0)",
  },
  exiting: {},
  exited: {},
};
const DrawerContent = styled.div.attrs(({ state }: { state: TransitionStatus }) => ({
  style: transitionStyles[state as keyof typeof transitionStyles],
  bg: "palette.background.paper",
}))<{ state: TransitionStatus; direction: "left" | "right" }>`
  position: absolute;
  top: 0;
  left: ${p => (p.direction === "right" ? 0 : "unset")};
  right: ${p => (p.direction === "left" ? 0 : "unset")};
  bottom: 0;
  z-index: 1;
  box-sizing: border-box;
  width: 80%;
  ${color};
  transform: translateX(
    ${p => (p.direction === "right" ? -100 : p.direction === "left" ? 100 : 0)}%
  );
  transition: transform ${DURATION}ms ease-out;
  max-width: 500px;
  flex: 1;
  display: flex;
  flex-direction: column;
  will-change: transform;
  overflow: hidden;
`;
const transitionContainerStyles = {
  entering: {},
  entered: {},
  exiting: {
    pointerEvents: "none",
  },
  exited: {
    pointerEvents: "none",
    visibility: "hidden",
  },
};
const DrawerContainer = styled.div.attrs(({ state }: { state: TransitionStatus }) => ({
  style: transitionContainerStyles[state as keyof typeof transitionContainerStyles],
}))<{ state: TransitionStatus }>`
  color: ${p => p.theme.colors.palette.text.shade90};
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
  z-index: 50;
`;
export type DrawerProps = {
  children?: React.ReactNode;
  isOpen?: boolean;
  onRequestClose?: (a: React.MouseEvent) => void;
  onRequestBack?: (a: React.MouseEvent) => void;
  direction?: "right" | "left";
  paper?: boolean;
  title?: string;
  preventBackdropClick?: boolean;
  forceDisableFocusTrap?: boolean;
  style?: React.CSSProperties;
  withPaddingTop?: boolean;
};
const domNode = document.getElementById("modals");

export function SideDrawer({
  children,
  isOpen = false,
  onRequestClose,
  onRequestBack,
  direction = "right",
  title,
  preventBackdropClick = false,
  forceDisableFocusTrap = false,
  ...props
}: DrawerProps) {
  const deviceBlocked = useDeviceBlocked();

  const onKeyPress = useCallback(
    e => {
      if (
        isOpen &&
        !preventBackdropClick &&
        e.key === "Escape" &&
        onRequestClose &&
        !deviceBlocked
      ) {
        e.preventDefault();
        onRequestClose(e);
      }
    },
    [isOpen, preventBackdropClick, onRequestClose, deviceBlocked],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKeyPress, false);
    return () => {
      window.removeEventListener("keydown", onKeyPress, false);
    };
  }, [onKeyPress]);
  const focusTrapElem = useRef<typeof DrawerContainer>(null);
  const focusTrap = useRef<FocusTrap | null>(null);
  const modalsState = useSelector(modalsStateSelector);
  const shouldDisableFocusTrap = Object.values(modalsState).reduce(
    (previous, current) => previous || current.isOpened,
    false,
  );
  useEffect(() => {
    if (forceDisableFocusTrap) {
      return;
    }
    if (isOpen && focusTrapElem.current && !shouldDisableFocusTrap) {
      focusTrap.current = createFocusTrap(focusTrapElem.current, {
        fallbackFocus: focusTrapElem.current,
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        preventScroll: true,
      });
      focusTrap.current?.activate();
    } else if (shouldDisableFocusTrap) {
      focusTrap.current?.deactivate();
      focusTrap.current = null;
    }
    return () => {
      focusTrap.current?.deactivate();
      focusTrap.current = null;
    };
  }, [isOpen, shouldDisableFocusTrap, forceDisableFocusTrap]);
  return domNode
    ? createPortal(
        <Transition
          in={isOpen}
          timeout={{
            appear: 0,
            enter: DURATION,
            exit: DURATION * 3, // leaves extra time for the animation to end before unmount
          }}
          unmountOnExit
        >
          {state => (
            <DrawerContainer
              className="sidedrawer"
              state={state}
              ref={focusTrapElem}
              tabIndex="-1"
              data-test-id="side-drawer-container"
            >
              <DrawerContent
                {...props}
                state={state}
                direction={direction}
                data-test-id="drawer-content"
              >
                <SideDrawerHeader
                  onRequestClose={onRequestClose}
                  onRequestBack={onRequestBack}
                  title={title}
                />
                {children}
              </DrawerContent>
              <DrawerBackdrop
                state={state}
                onClick={preventBackdropClick || deviceBlocked ? undefined : onRequestClose}
                data-test-id="drawer-overlay"
              />
            </DrawerContainer>
          )}
        </Transition>,
        domNode,
      )
    : null;
}
