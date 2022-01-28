import React from "react";
import { isElement } from "react-is";
import { Props as StepperProps } from "../progress/Stepper";
import Flex, { FlexBoxProps as FlexProps } from "../../layout/Flex";
import { Stepper } from "..";

export type StepPropsBase = {
  /**
   * A specific index, can be used to explicitely order steps.
   */
  index?: number;
};

export type StepProps = StepPropsBase & {
  /**
   * The label of the step.
   */
  label: string;
  /**
   * Hides the step from the progress stepper.
   */
  hidden?: boolean;
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

type StepChild = React.ReactElement<StepProps>;
type StepSection = React.ReactElement<StepPropsBase>;

type SectionRenderFunc<ExtraProps> = (props: InnerProps & ExtraProps) => React.ReactNode;
type SectionSteps = StepSection[];
type SectionStepRenderFunc<ExtraProps> = (
  args: InnerProps & ExtraProps & { children: React.ReactNode },
) => React.ReactNode;

export interface Props<ExtraProps> {
  /**
   * The index of the active step.
   */
  activeIndex: number;
  /**
   * An optional header displayed above the stepper.
   */
  header?: SectionRenderFunc<ExtraProps>;
  /**
   * List of individual header components for each step. Overrides `header` prop.
   */
  stepHeaders?: SectionSteps;
  /**
   * Custom rendering function to wrap header (only used if header is not a render function)
   */
  renderStepHeader?: SectionStepRenderFunc<ExtraProps>;
  /**
   * An optional footer displayed below the body.
   */
  footer?: SectionRenderFunc<ExtraProps>;
  /**
   * List of individual footer components for each step. Overrides `footer` prop.
   */
  stepFooters?: SectionSteps;
  /**
   * Custom rendering function to wrap stepFooter (only used if footer is not a render function)
   */
  renderStepFooter?: SectionStepRenderFunc<ExtraProps>;
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
  extraStepperProps?: Partial<StepperProps>;
  /**
   * Extra props that are passed to the stepper `Flex` wrapper.
   */
  extraStepperContainerProps?: FlexProps;
  /**
   * Custom rendering function to wrap children.
   */
  renderChildren?: (
    args: InnerProps & ExtraProps & { children: React.ReactNode },
  ) => React.ReactNode;
  /**
  /**
   * A list of children representing each step of the flow.
   */
  children: StepChild | StepChild[];
}

function FlowStepper<ExtraProps>({
  activeIndex,
  header,
  stepHeaders,
  renderStepHeader,
  footer,
  stepFooters,
  renderStepFooter,
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
      const hidden = isElement(child) && child.props.hidden;

      if (label && !hidden) {
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

  const renderArgs = { ...extraProps, activeIndex, stepsLength: steps.length } as InnerProps &
    ExtraProps;

  function getSectionContents(
    renderFunc?: SectionRenderFunc<ExtraProps>,
    steps?: SectionSteps,
    renderStepFunc?: SectionStepRenderFunc<ExtraProps>,
  ) {
    const stepSection =
      steps &&
      steps.find((item, idx) => (isElement(item) && item.props.index) ?? idx === activeIndex);
    return stepSection
      ? renderStepFunc
        ? renderStepFunc({ ...renderArgs, children: stepSection })
        : stepSection
      : renderFunc && renderFunc(renderArgs);
  }

  return (
    <Flex flex={1} flexDirection="column" {...extraContainerProps}>
      {getSectionContents(header, stepHeaders, renderStepHeader)}
      <Flex my={8} justifyContent="center" {...extraStepperContainerProps}>
        <Stepper activeIndex={activeIndex} steps={steps} flex={1} {...extraStepperProps} />
      </Flex>
      <Flex flex={1} flexDirection="column" position="relative">
        {renderChildren
          ? renderChildren({ ...renderArgs, children: innerContents })
          : innerContents}
      </Flex>
      {getSectionContents(footer, stepFooters, renderStepFooter)}
    </Flex>
  );
}

function Step({ children }: StepProps) {
  return <>{children}</>;
}

FlowStepper.Step = Step;
export default FlowStepper;

export type IndexedStepProps = StepProps & {
  /**
   * String to identify the step. Must be different from sibling steps's `key` prop.
   */
  itemKey: string;
};

type IndexedStepperChild = React.ReactElement<IndexedStepProps>;

export type IndexedProps<ExtraProps> = Omit<Props<ExtraProps>, "activeIndex" | "children"> & {
  /**
   * The key of the active step
   */
  activeKey: string;

  /**
   * A list of children representing each step of the flow.
   */
  children: IndexedStepperChild | IndexedStepperChild[];
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
function FlowStepperIndexed<ExtraProps>(props: IndexedProps<ExtraProps>) {
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

function IndexedStep({ children }: IndexedStepProps) {
  return <>{children}</>;
}

FlowStepperIndexed.Step = IndexedStep;
FlowStepper.Indexed = FlowStepperIndexed;
