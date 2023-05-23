import React, { PureComponent } from "react";
import { createPortal } from "react-dom";
import { connect } from "react-redux";
import styled, { CSSProperties, DefaultTheme } from "styled-components";
import noop from "lodash/noop";
import { Transition, TransitionStatus } from "react-transition-group";
import { closeModal } from "~/renderer/actions/modals";
import { isModalOpened, getModalData } from "~/renderer/reducers/modals";
import Snow, { isSnowTime } from "~/renderer/extra/Snow";
import { State } from "~/renderer/reducers";
import { Dispatch } from "redux";
export { default as ModalBody } from "./ModalBody";
const domNode = document.getElementById("modals");
const mapStateToProps = <Data,>(state: State, { name, isOpened, onBeforeOpen }: Props<Data>) => {
  const data = getModalData(state, name || "");
  const modalOpened = isOpened || (name && isModalOpened(state, name));
  if (onBeforeOpen && modalOpened) {
    onBeforeOpen({
      data,
    } as { data: Data });
  }
  return {
    isOpened: !!modalOpened,
    data,
  };
};
const mapDispatchToProps = <Data,>(dispatch: Dispatch, { name, onClose = noop }: Props<Data>) => ({
  onClose: name
    ? () => {
        dispatch(closeModal(name));
        onClose();
      }
    : onClose,
});
const transitionsOpacity = {
  entering: {
    opacity: 0,
  },
  entered: {
    opacity: 1,
  },
  exiting: {
    opacity: 0,
  },
  exited: {
    opacity: 0,
  },
};
const transitionsScale = {
  entering: {
    transform: "scale(1.1)",
  },
  entered: {
    transform: "scale(1)",
  },
  exiting: {
    transform: "scale(1.1)",
  },
  exited: {
    transform: "scale(1.1)",
  },
};
const Container = styled.div.attrs(
  ({
    state,
    centered,
    isOpened,
  }: {
    state: TransitionStatus;
    centered?: boolean;
    isOpened?: boolean;
  }) => ({
    style: {
      ...transitionsOpacity[state as keyof typeof transitionsOpacity],
      justifyContent: centered ? "center" : "flex-start",
      pointerEvents: isOpened ? "auto" : "none",
    },
  }),
)<{
  state: TransitionStatus;
  centered?: boolean;
  isOpened?: boolean;
  backdropColor?: boolean | null;
}>`
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
const BodyWrapper = styled.div.attrs(({ state }: { state: TransitionStatus }) => ({
  style: {
    ...transitionsOpacity[state as keyof typeof transitionsOpacity],
    ...transitionsScale[state as keyof typeof transitionsScale],
  } as CSSProperties,
}))<{ state: TransitionStatus; width?: number }>`
  background: ${p => p.theme.colors.palette.background.paper};
  color: ${p => p.theme.colors.palette.text.shade80};
  width: ${p => p.width || 500}px;
  border-radius: 3px;
  box-shadow: 0 10px 20px 0 rgba(0, 0, 0, 0.2);
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  transform: scale(1.1);
  opacity: 0;
  transition: all 200ms cubic-bezier(0.3, 1, 0.5, 0.8);
`;
export type RenderProps<Data> = {
  onClose?: (() => void) | undefined;
  data: Data;
};
type Props<Data> = {
  isOpened?: boolean;
  children?: React.ReactNode;
  centered?: boolean;
  onClose?: (() => void) | undefined;
  onHide?: (() => void) | undefined;
  render?: (a: RenderProps<Data>) => React.ReactNode;
  data?: Data;
  preventBackdropClick?: boolean;
  width?: number;
  theme?: DefaultTheme;
  name?: string;
  // eslint-disable-line
  onBeforeOpen?: (a: { data: Data }) => void;
  // eslint-disable-line
  backdropColor?: boolean | undefined | null;
  bodyStyle?: CSSProperties;
};
class Modal<Data> extends PureComponent<
  Props<Data>,
  {
    directlyClickedBackdrop: boolean;
  }
> {
  state = {
    directlyClickedBackdrop: false,
  };

  componentDidMount() {
    document.addEventListener("keyup", this.handleKeyup);
    document.addEventListener("keydown", this.preventFocusEscape);
  }

  componentDidUpdate({ isOpened, onHide }: Props<Data>) {
    if (!isOpened && onHide) onHide();
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.handleKeyup);
    document.removeEventListener("keydown", this.preventFocusEscape);
  }

  handleKeyup = (e: KeyboardEvent) => {
    const { onClose, preventBackdropClick } = this.props;
    if (e.which === 27 && onClose && !preventBackdropClick) {
      onClose();
    }
  };

  preventFocusEscape = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      const { target } = e;
      const focusableQuery =
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), *[tabindex]";
      const modalWrapper = document.getElementById("modals");
      if (!modalWrapper || !(target instanceof window.HTMLElement)) return;
      const focusableElements = modalWrapper.querySelectorAll(focusableQuery) as NodeListOf<
        HTMLElement
      >;
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

  handleClickOnBackdrop = () => {
    const { preventBackdropClick, onClose } = this.props;
    const { directlyClickedBackdrop } = this.state;
    if (directlyClickedBackdrop && !preventBackdropClick && onClose) {
      onClose();
    }
  };

  onDirectMouseDown = () =>
    this.setState({
      directlyClickedBackdrop: true,
    });

  onIndirectMouseDown = () =>
    this.setState({
      directlyClickedBackdrop: false,
    });

  /** combined with tab-index 0 this will allow tab navigation into the modal disabling tab navigation behind it */
  setFocus = (r: HTMLDivElement) => {
    /** only pull focus if focus is out of modal ie: no input autofocused in modal */
    r && !r.contains(document.activeElement) && r.focus();
  };

  swallowClick = (e: React.UIEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  render() {
    const {
      children,
      render,
      centered,
      onClose,
      data,
      isOpened,
      width,
      backdropColor,
      bodyStyle,
    } = this.props;
    const renderProps: RenderProps<Data> = {
      onClose,
      data: data as Data,
    };
    const modal = (
      <Transition
        in={isOpened}
        appear
        mountOnEnter
        unmountOnExit
        timeout={{
          appear: 100,
          enter: 100,
          exit: 200,
        }}
      >
        {state => {
          return (
            <Container
              data-test-id="modal-backdrop"
              state={state}
              centered={centered}
              isOpened={isOpened}
              onMouseDown={this.onDirectMouseDown}
              onClick={this.handleClickOnBackdrop}
              backdropColor={backdropColor}
            >
              {isSnowTime() ? <Snow numFlakes={100} /> : null}
              <BodyWrapper
                tabIndex={0}
                ref={this.setFocus}
                state={state}
                width={width}
                onClick={this.swallowClick}
                onMouseDown={e => {
                  this.onIndirectMouseDown();
                  e.stopPropagation();
                }}
                data-test-id="modal-container"
                style={bodyStyle}
              >
                {render && render(renderProps)}
                {children}
              </BodyWrapper>
            </Container>
          );
        }}
      </Transition>
    );
    return domNode ? createPortal(modal, domNode) : null;
  }
}

export default (connect(mapStateToProps, mapDispatchToProps)(Modal) as unknown) as typeof Modal; // to preserve generics
