import React from "react";
import Flex, { FlexBoxProps as FlexProps } from "../../layout/Flex";
import { Stepper } from "..";

export type StepProps = {
  label: string;
  children: React.ReactNode;
};

interface InnerProps {
  /**
   * The active index.
   */
  activeIndex: number;
  /**
   * The total number of steps.
   */
  stepsLength: number;
}

export interface Props<ExtraProps> {
  /**
   * The index of the active step.
   */
  activeIndex: number;
  /**
   * An optional header displayed above the stepper.
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
   * Extra props that are passed to the container `Flex` element.
   */
  extraContainerProps?: FlexProps;
  /**
   * Extra props that are passed to the stepper component.
   */
  extraStepperProps?: FlexProps;
  /**
   * Extra props that are passed to the stepper `Flex` wrapper.
   */
  extraStepperContainerProps?: FlexProps;
  /**
   * Custom rendering function to wrap children.
   */
  renderChildren?: (args: { children: React.ReactNode }) => React.ReactNode;
  /**
  /**
   * A list of children representing each step of the flow.
   */
  children: React.ReactElement<StepProps> | React.ReactElement<StepProps>[];
}

function FlowStepper<ExtraProps>({
  activeIndex,
  header,
  footer,
  extraProps,
  extraContainerProps,
  extraStepperProps,
  extraStepperContainerProps,
  renderChildren,
  children,
}: Props<ExtraProps>) {
  const steps = React.Children.map(children, (child) => child.props.label);
  const innerJSX = React.Children.map(children, (child, index) =>
    index === activeIndex ? child : null,
  );

  return (
    <Flex flex={1} flexDirection="column" {...extraContainerProps}>
      {header &&
        header({ ...extraProps, activeIndex, stepsLength: steps.length } as InnerProps &
          ExtraProps)}
      <Flex my={8} justifyContent="center" {...extraStepperContainerProps}>
        <Stepper activeIndex={activeIndex} steps={steps} flex={1} {...extraStepperProps} />
      </Flex>
      <Flex flex={1} flexDirection="column" position="relative">
        {renderChildren ? renderChildren({ children: innerJSX }) : innerJSX}
      </Flex>
      {footer &&
        footer({ ...extraProps, activeIndex, stepsLength: steps.length } as InnerProps &
          ExtraProps)}
    </Flex>
  );
}

function Step({ children }: StepProps) {
  return <>{children}</>;
}

FlowStepper.Step = Step;
export default FlowStepper;
