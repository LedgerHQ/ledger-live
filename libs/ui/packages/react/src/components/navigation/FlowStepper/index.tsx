import React from "react";
import { isElement } from "react-is";
import { Props as StepperProps } from "../progress/Stepper";
import Flex, { FlexBoxProps as FlexProps } from "../../layout/Flex";
import { Stepper } from "..";

export type StepProps = {
  /**
   * A specific index, can be used to explicitely order steps.
   */
  index?: number;
  /**
   * Custom header for this step.
   */
  header?: React.ReactNode;
  /**
   * Custom footer for this step.
   */
  footer?: React.ReactNode;
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
type SectionRenderFunc<ExtraProps> = (props: InnerProps & ExtraProps) => React.ReactNode;
type SectionStepRenderFunc<ExtraProps> = (
  args: InnerProps & ExtraProps & { children: React.ReactNode },
) => React.ReactNode;

export interface Props<ExtraProps> {
  /**
   * The index of the active step.
   */
  activeIndex: number;
  /**
   * An optional generic header displayed above the stepper.
   */
  header?: SectionRenderFunc<ExtraProps>;
  /**
   * Custom rendering function to wrap the header (only used if the `header` is defined
   * on the child for the current step.)
   */
  renderStepHeader?: SectionStepRenderFunc<ExtraProps>;
  /**
   * An optional generic footer displayed below the body.
   */
  footer?: SectionRenderFunc<ExtraProps>;
  /**
   * Custom rendering function to wrap the footer (only used if the `footer` is defined
   * on the child for the current step.)
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
   * Extra props that are passed to the children `Flex` wrapper.
   */
  extraChildrenContainerProps?: FlexProps;
  /**
   * Custom rendering function to wrap children.
   */
  renderChildren?: (
    args: InnerProps & ExtraProps & { children: React.ReactNode },
  ) => React.ReactNode;
  /**
   * A list of children representing each step of the flow.
   * Each child can have a prop `stepHeader` and/or `stepFooter` that will
   * associate a custom header/footer to this particular step.
   * The custom header/footer can be wrapped using the prop renderStepHeader/renderStepFooter.
   */
  children: StepChild | StepChild[];
}

function FlowStepper<ExtraProps>({
  activeIndex,
  header,
  renderStepHeader,
  footer,
  renderStepFooter,
  extraProps,
  extraContainerProps,
  extraStepperProps,
  extraStepperContainerProps,
  extraChildrenContainerProps,
  renderChildren,
  children,
}: Props<ExtraProps>) {
  const { steps, innerContents, stepFooter, stepHeader } = React.Children.toArray(children).reduce<{
    steps: string[];
    innerContents: React.ReactNode | null;
    stepHeader: React.ReactNode | null;
    stepFooter: React.ReactNode | null;
  }>(
    (acc, child, idx) => {
      const index = (isElement(child) && child.props.index) ?? idx;
      const label = isElement(child) && child.props.label;
      const hidden = isElement(child) && child.props.hidden;
      const stepHeader = isElement(child) && child.props.header;
      const stepFooter = isElement(child) && child.props.footer;

      if (label && !hidden) {
        acc.steps[index] = label;
      }
      if (index === activeIndex) {
        acc.innerContents = child;
        acc.stepFooter = stepFooter;
        acc.stepHeader = stepHeader;
      }
      return acc;
    },
    {
      steps: [],
      innerContents: null,
      stepHeader: null,
      stepFooter: null,
    },
  );

  const renderArgs = { ...extraProps, activeIndex, stepsLength: steps.length } as InnerProps &
    ExtraProps;

  function getSectionContents(
    renderFunc?: SectionRenderFunc<ExtraProps>,
    stepSection?: React.ReactNode,
    renderStepFunc?: SectionStepRenderFunc<ExtraProps>,
  ) {
    return stepSection
      ? renderStepFunc
        ? renderStepFunc({ ...renderArgs, children: stepSection })
        : stepSection
      : renderFunc && renderFunc(renderArgs);
  }

  return (
    <Flex flex={1} flexDirection="column" {...extraContainerProps}>
      {getSectionContents(header, stepHeader, renderStepHeader)}
      <Flex my={8} justifyContent="center" {...extraStepperContainerProps}>
        <Stepper activeIndex={activeIndex} steps={steps} flex={1} {...extraStepperProps} />
      </Flex>
      <Flex flex={1} flexDirection="column" position="relative" {...extraChildrenContainerProps}>
        {renderChildren
          ? renderChildren({ ...renderArgs, children: innerContents })
          : innerContents}
      </Flex>
      {getSectionContents(footer, stepFooter, renderStepFooter)}
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
 * This is a FlowStepper where each child must have an `itemKey: string` prop
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
