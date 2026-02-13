import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { CSSTransitionProps } from "react-transition-group/CSSTransition";
import styled from "styled-components";
const duration = 150;
const ChildrenWrapper = styled.div<{ timeout: number }>`
  transition: ${props => `opacity ${props.timeout}ms ease-in-out`};

  &.transition-inout-enter {
    opacity: 0;
  }

  &.transition-inout-enter-active {
    opacity: 1;
  }

  &.transition-inout-exit {
    opacity: 1;
  }

  &.transition-inout-exit-active {
    opacity: 0;
  }
`;
type TransitionInOutProps = Partial<
  CSSTransitionProps<HTMLDivElement> & {
    children: React.ReactNode;
    in: boolean;
    timeout?: number;
    appear?: boolean;
    mountOnEnter?: boolean;
    unmountOnExit?: boolean;
  }
>;

const TransitionInOut = ({
  children,
  in: inProp,
  timeout = duration,
  ...TransitionProps
}: TransitionInOutProps): React.JSX.Element => {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <CSSTransition
      {...TransitionProps}
      nodeRef={nodeRef}
      in={inProp}
      timeout={timeout}
      classNames="transition-inout"
    >
      <ChildrenWrapper ref={nodeRef} timeout={timeout}>
        {children}
      </ChildrenWrapper>
    </CSSTransition>
  );
};

export default TransitionInOut;
