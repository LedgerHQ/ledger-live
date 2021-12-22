import React from "react";
import { isElement } from "react-is";
import Flex, { FlexBoxProps as FlexProps } from "../../layout/Flex";
import { Stepper } from "..";

export type StepProps = {
  /**
   * The label of the step.
   */
  label: string;
  /**
   * A specific index, useful if you want the step to be invisible by specifying negative or floating indexes.
   */
  index?: number;
  /**
   * The step contents.
   */
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
  const { steps, innerContents } = React.Children.toArray(children).reduce<{
    steps: string[];
    innerContents: React.ReactNode | null;
  }>(
    (acc, child, idx) => {
      const index = (isElement(child) && child.props.index) ?? idx;
      const label = isElement(child) && child.props.label;

      if (label) {
        acc.steps[index] = label;
      }
      if (index === activeIndex) {
        acc.innerContents = child;
      }
      return acc;
    },
    {
      steps: [],
      innerContents: null,
    },
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
        {renderChildren ? renderChildren({ children: innerContents }) : innerContents}
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
