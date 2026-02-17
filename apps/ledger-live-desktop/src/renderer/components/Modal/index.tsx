import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type UIEvent,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import styled, { DefaultTheme } from "styled-components";
import noop from "lodash/noop";
import { Transition, TransitionStatus } from "react-transition-group";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { closeModal } from "~/renderer/actions/modals";
import { isModalOpened, getModalData } from "~/renderer/reducers/modals";
import { ModalData } from "~/renderer/modals/types";
import Snow, { isSnowTime } from "~/renderer/extra/Snow";
import type { State } from "~/renderer/reducers";

export { default as ModalBody } from "./ModalBody";

const transitionsOpacity: Record<TransitionStatus, { opacity: number }> = {
  entering: { opacity: 0 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
  unmounted: { opacity: 0 },
};
const transitionsScale: Record<TransitionStatus, { transform: string }> = {
  entering: { transform: "scale(1.1)" },
  entered: { transform: "scale(1)" },
  exiting: { transform: "scale(1.1)" },
  exited: { transform: "scale(1.1)" },
  unmounted: { transform: "scale(1.1)" },
};

type ContainerProps = {
  state: TransitionStatus;
  centered?: boolean;
  isOpened?: boolean;
  backdropColor?: boolean | null;
};

const Container = styled.div<ContainerProps>`
  background-color: ${p => (p.backdropColor ? "rgba(0, 0, 0, 0.4)" : "rgba(0,0,0,0)")};
  opacity: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  padding: 60px 0 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 200ms cubic-bezier(0.3, 1, 0.5, 0.8);
`;

type BodyWrapperProps = { state: TransitionStatus; width?: number };

const BodyWrapper = styled.div<BodyWrapperProps>`
  background: ${p => p.theme.colors.background.card};
  color: ${p => p.theme.colors.neutral.c80};
  width: ${p => p.width ?? 500}px;
  border-radius: 3px;
  box-shadow: 0 10px 20px 0 rgba(0, 0, 0, 0.2);
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  transform: scale(1.1);
  opacity: 0;
  transition: all 200ms cubic-bezier(0.3, 1, 0.5, 0.8);
  outline: none;
`;

export type RenderProps<Name extends keyof ModalData> = {
  onClose: () => void;
  data: ModalData[Name];
};

export type Props<Name extends keyof ModalData> = {
  isOpened?: boolean;
  children?: ReactNode;
  centered?: boolean;
  onClose?: () => void;
  onHide?: () => void;
  render?: (a: RenderProps<Name>) => ReactNode;
  data?: ModalData[Name];
  preventBackdropClick?: boolean;
  width?: number;
  theme?: DefaultTheme;
  name?: Name;
  onBeforeOpen?: (a: { data: ModalData[Name] | undefined }) => void;
  backdropColor?: boolean | null;
  bodyStyle?: CSSProperties;
};

function ModalInner<Name extends keyof ModalData>(props: Props<Name>) {
  const {
    name,
    isOpened: isOpenedProp,
    onClose: onCloseProp = noop,
    onHide,
    onBeforeOpen,
    children,
    render,
    centered,
    width,
    backdropColor,
    bodyStyle,
    preventBackdropClick,
  } = props;

  const dispatch = useDispatch();
  const reduxData = useSelector((state: State) => (name ? getModalData(state, name) : undefined));
  const reduxOpened = useSelector((state: State) => (name ? isModalOpened(state, name) : false));

  const isOpened = isOpenedProp ?? reduxOpened;
  const data = props.data ?? reduxData;

  const [directlyClickedBackdrop, setDirectlyClickedBackdrop] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const onClose = useCallback(() => {
    if (name) {
      dispatch(closeModal(name));
    }
    onCloseProp();
  }, [name, onCloseProp, dispatch]);

  useEffect(() => {
    if (isOpened && onBeforeOpen) {
      onBeforeOpen({ data });
    }
  }, [isOpened, data, onBeforeOpen]);

  const prevOpenedRef = useRef(isOpened);
  useEffect(() => {
    if (prevOpenedRef.current && !isOpened && onHide) {
      onHide();
    }
    prevOpenedRef.current = isOpened;
  }, [isOpened, onHide]);

  useEffect(() => {
    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose && !preventBackdropClick) {
        onClose();
      }
    };
    const preventFocusEscape = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const { target } = e;
        const focusableQuery =
          "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), *[tabindex]";
        const modalWrapper = document.getElementById("modals");
        if (!modalWrapper || !(target instanceof window.HTMLElement)) return;
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
        const focusableElements = modalWrapper.querySelectorAll(
          focusableQuery,
        ) as NodeListOf<HTMLElement>;
        if (!focusableElements.length) return;
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        if (e.shiftKey && firstFocusable.isSameNode(target)) {
          lastFocusable.focus();
          e.stopPropagation();
          e.preventDefault();
        } else if (!e.shiftKey && lastFocusable.isSameNode(target)) {
          firstFocusable.focus();
          e.stopPropagation();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keyup", handleKeyup);
    document.addEventListener("keydown", preventFocusEscape);
    return () => {
      document.removeEventListener("keyup", handleKeyup);
      document.removeEventListener("keydown", preventFocusEscape);
    };
  }, [onClose, preventBackdropClick]);

  const handleClickOnBackdrop = useCallback(() => {
    if (directlyClickedBackdrop && !preventBackdropClick && onClose) {
      onClose();
    }
  }, [directlyClickedBackdrop, preventBackdropClick, onClose]);

  const setFocus = useCallback((el: HTMLDivElement | null) => {
    if (el && !el.contains(document.activeElement)) {
      el.focus();
    }
  }, []);

  const swallowClick = useCallback((e: UIEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const domNode = document.getElementById("modals");
  const renderProps: RenderProps<Name> = {
    onClose,
    // data is defined when modal is opened and render is used
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    data: data as ModalData[Name],
  };

  const modal = (
    <Transition
      in={isOpened}
      appear
      mountOnEnter
      unmountOnExit
      timeout={{ appear: 100, enter: 100, exit: 200 }}
      nodeRef={nodeRef}
    >
      {state => {
        const containerStyle: CSSProperties = {
          ...transitionsOpacity[state],
          justifyContent: centered ? "center" : "flex-start",
          pointerEvents: isOpened ? "auto" : "none",
        };
        const bodyStyleComputed: CSSProperties = {
          ...transitionsOpacity[state],
          ...transitionsScale[state],
          ...(bodyStyle ?? {}),
        };
        return (
          <Container
            ref={nodeRef}
            data-testid="modal-backdrop"
            state={state}
            centered={centered}
            isOpened={isOpened}
            onMouseDown={() => setDirectlyClickedBackdrop(true)}
            onClick={handleClickOnBackdrop}
            backdropColor={backdropColor}
            style={containerStyle}
          >
            {isSnowTime() ? <Snow numFlakes={100} /> : null}
            <BodyWrapper
              tabIndex={0}
              ref={setFocus}
              state={state}
              width={width}
              onClick={swallowClick}
              onMouseDown={e => {
                setDirectlyClickedBackdrop(false);
                e.stopPropagation();
              }}
              data-testid="modal-container"
              style={bodyStyleComputed}
            >
              {render?.(renderProps)}
              {children}
            </BodyWrapper>
          </Container>
        );
      }}
    </Transition>
  );

  return domNode ? createPortal(modal, domNode) : null;
}

// Cast preserves generic so <Modal name="MODAL_XXX" /> infers Name from name prop
/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
const Modal = ModalInner as <Name extends keyof ModalData>(
  props: Props<Name>,
) => React.ReactElement | null;

export default Modal;
