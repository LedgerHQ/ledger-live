import React from "react";
import { isElement } from "react-is";
import FlowStepper, { Props as BaseProps, StepProps as BaseStepProps } from ".";

export type StepProps = BaseStepProps & {
  /**
   * String to identify the step. Must be different from sibling steps's `key` prop.
   */
  itemKey: string;
};

type StepperChild = React.ReactElement<StepProps>;

export type Props<ExtraProps> = Omit<BaseProps<ExtraProps>, "activeIndex" | "children"> & {
  /**
   * The key of the active step
   */
  activeKey: string;

  /**
   * A list of children representing each step of the flow.
   */
  children: StepperChild | StepperChild[];
};

/**
 * This is a FlowStepper where each children must have an `itemKey: string` prop
 * and the active step is defined by the `activeKey: string` prop.
 *
 * This allows for usages with a lot of steps where dealing with indices could be
 * painful and error prone (for instance inserting/removing a step somewhere would shift
 * the indices of the following steps and navigation would be impacted).
 *
 * By using string identifiers (`itemKey`) for each step, it's more "human readable"
 * and less error prone to setup a navigation logic between steps.
 */
function FlowStepperIndexedByKey<ExtraProps>(props: Props<ExtraProps>) {
  const { activeKey, children, ...otherProps } = props;
  const activeIndex = React.Children.toArray(children).findIndex((child) => {
    const res = isElement(child) && child.props.itemKey === activeKey;
    return res;
  });
  return (
    <FlowStepper {...otherProps} activeIndex={activeIndex}>
      {children}
    </FlowStepper>
  );
}

function Step({ children }: StepProps) {
  return <>{children}</>;
}

FlowStepperIndexedByKey.Step = Step;

export default FlowStepperIndexedByKey;
