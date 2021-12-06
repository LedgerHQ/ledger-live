import React, { useRef, useEffect } from "react";
import { SafeAreaView } from "react-native";
import Flex from "../../Layout/Flex";
import ProgressBar from "../../ProgressBar";
import {
  TransitionProps,
  Transition,
  TransitionStatus,
} from "../../transitions";

interface InnerProps {
  activeIndex: number;
  stepsLength: number;
}

export interface RenderTransitionProps extends InnerProps, TransitionProps {
  index: number;
  previousActiveIndex: number | null;
}

export interface Props<ExtraProps> {
  /**
   * The index of the active step.
   */
  activeIndex: number;
  /**
   * An optional header displayed above the progress bar.
   */
  header?: (props: InnerProps & ExtraProps) => React.ReactNode;
  /**
   * An optional footer displayed below the body.
   */
  footer?: (props: InnerProps & ExtraProps) => React.ReactNode;
  /**
   * Extra props that are passed to the header and footer render functions.
   */
  extraProps?: ExtraProps;
  /**
   * **Use this prop in combination with `transitionDuration`.**
   *
   * A render function wrapping every children which allows using transitions.
   * This function is called with various useful arguments, most notably:
   * - the child index
   * - the current active index
   * - the previous active index
   * - the transition status ("entered", "entering", "exiting" or "exited")
   */
  renderTransition?: (props: RenderTransitionProps) => JSX.Element | null;
  /**
   * **Use this prop in combination with `renderTransition`.**
   *
   * If this prop is true and if `renderTransition` is used
   * then specifies the duration of the transition in milliseconds.
   */
  transitionDuration?: number;
  /**
   * A list of children representing each step of the flow.
   */
  children: React.ReactNode;
}

function FlowStepper<ExtraProps>({
  activeIndex,
  header,
  footer,
  extraProps,
  renderTransition,
  transitionDuration = 0,
  children,
}: Props<ExtraProps>) {
  const previousActiveIndex = useRef<number | null>(null);
  const stepsLength = React.Children.count(children);

  useEffect(
    () => () => {
      previousActiveIndex.current = activeIndex;
    },
    [activeIndex]
  );

  return (
    <Flex flex={1}>
      {header &&
        header({ ...extraProps, activeIndex, stepsLength } as InnerProps &
          ExtraProps)}
      <SafeAreaView style={{ flex: 1 }}>
        <ProgressBar index={activeIndex} length={stepsLength} />
        <Flex flex={1}>
          {React.Children.map(children, (child, index) => {
            if (renderTransition && transitionDuration) {
              return (
                <Transition
                  in={index === activeIndex}
                  timeout={transitionDuration}
                  mountOnEnter
                  unmountOnExit
                >
                  {(status: TransitionStatus) => {
                    return renderTransition({
                      index,
                      activeIndex,
                      previousActiveIndex: previousActiveIndex.current,
                      stepsLength,
                      status,
                      duration: transitionDuration,
                      children: child,
                    });
                  }}
                </Transition>
              );
            } else {
              return index === activeIndex ? child : null;
            }
          })}
        </Flex>
        {footer &&
          footer({ ...extraProps, activeIndex, stepsLength } as InnerProps &
            ExtraProps)}
      </SafeAreaView>
    </Flex>
  );
}

export default FlowStepper;
