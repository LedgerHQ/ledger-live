import React, { useMemo } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import styled from "styled-components";
// @ts-expect-error Typings…
import { useArgs } from "@storybook/client-api";
import { Props as FlowStepperProps } from "./index";
import { Divider, Flex, FlowStepper, Text, Button, Box, Link, IconsLegacy, Tag } from "../../..";
import type { Size as TagSize } from "../../Tag";
import { lipsum, StoryTemplate } from "../../helpers";
import { useState } from "react";

const description = `
### A customizable flow layout.

This component accepts multiple children as steps and displays the active one as well
a progress stepper and optionally a header and/or a footer.

## Usage

\`\`\`js

import { FlowStepper } from "@ledgerhq/react-ui"

\`\`\`

Each step is a child of the component, which must be a JSX element having at least a \`label\` prop.
This label will be used by the flow stepper to populate the name of the step inside the progress stepper component.

### Tip #1:
To avoid creating specific passthrough components you can use the \`<FlowStepper.Step label="Step label">{…}</FlowStepper.Step>\` helper.

### Tip #2:
You can define a specific header/footer for a given step by using the props \`header\`/\`footer\` on each step child of the component.

\`\`\`jsx
<FlowStepper
  activeIndex={1}
  renderStepFooter={ // Optional
    ({activeIndex, stepsLength, children}) => (
      <YourFooterWrapper>
        {children}
      </YourFooterWrapper>
    )
  }
>
  <YourStepA label="StepA" />
  <YourStepB label="StepB" footer={<YourStepBFooter />}/>
  <YourStepC label="StepC" />
  <YourStepD label="StepD" />
</FlowStepper.Indexed>
\`\`\`

### Tip #3:
If you want to define steps that are identified by a \`string\` identifier, you can use FlowStepper with the \`activeKey\` prop and children that each have an \`itemKey\` prop.
This allows you to not have to hardcode steps indices.

\`\`\`jsx
<FlowStepper.Indexed activeKey="stepC">
  <YourStepA label="StepA" itemKey="stepA" />
  <YourStepB label="StepB" itemKey="stepB" />
  <YourStepC label="StepC" itemKey="stepC" />
  <YourStepD label="StepD" itemKey="stepD" />
</FlowStepper.Indexed>
\`\`\`


## Basic example:

\`\`\`jsx
const NB_OF_STEPS = 10;
const [activeIndex, setActiveIndex] = React.useState(0);

<FlowStepper
  activeIndex={activeIndex}
  header={() => (
    <Text variant="h1">
      Header - Page n°{activeIndex + 1} / {NB_OF_STEPS}
    </Text>
  )}
  footer={() => (
    <Flex mt={6} flexDirection="column" rowGap={6} alignItems="flex-end">
      <Box alignSelf="stretch">
        <Divider variant="light" />
      </Box>
      <Flex columnGap={6}>
        <Button
          variant="main"
          outline
          disabled={activeIndex <= 0}
          onClick={() => setActiveIndex(i => i - 1)}
        >
          Previous
        </Button>
        <Button
          variant="main"
          disabled={activeIndex >= NB_OF_STEPS - 1}
          onClick={() => setActiveIndex(i => i + 1)}
        >
          Continue
        </Button>
      </Flex>
    </Flex>
  )}
>
  {new Array(NB_OF_STEPS).fill(0).map((_, index) => (
    <FlowStepper.Step label={"Step " + index}>
      <Text key={index} variant="body">
        {lipsum}
      </Text>
    </FlowStepper.Step>
  ))}
</FlowStepper>
\`\`\`


`;

export default {
  title: "Navigation/FlowStepper",
  component: FlowStepper,
  argTypes: {
    activeIndex: { control: "number" },
    extraProps: { control: "disabled" },
    extraContainerProps: { control: "disabled" },
    extraStepperProps: { control: "disabled" },
    extraStepperContainerProps: { control: "disabled" },
    children: { control: "disabled" },
    renderChildren: { control: "disabled" },
    header: { control: "disabled" },
    stepHeaders: { control: "disabled" },
    renderStepHeader: { control: "disabled" },
    footer: { control: "disabled" },
    stepFooters: { control: "disabled" },
    renderStepFooter: { control: "disabled" },
  },
  args: {
    activeIndex: 0,
  },
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
};

const NB_OF_STEPS = 5;
export const Minimal: StoryTemplate<FlowStepperProps<unknown>> = args => {
  const { activeIndex, ...rest } = args;
  const [, updateArgs] = useArgs();

  return (
    <FlowStepper
      activeIndex={activeIndex}
      header={() => (
        <Text variant="h1">
          Header - Page n°{activeIndex + 1} / {NB_OF_STEPS}
        </Text>
      )}
      footer={() => (
        <Flex mt={6} flexDirection="column" rowGap={6} alignItems="flex-end">
          <Box alignSelf="stretch">
            <Divider />
          </Box>
          <Flex columnGap={6}>
            <Button
              variant="main"
              outline
              disabled={activeIndex <= 0}
              onClick={() => updateArgs({ activeIndex: activeIndex - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="main"
              disabled={activeIndex >= NB_OF_STEPS - 1}
              onClick={() => updateArgs({ activeIndex: activeIndex + 1 })}
            >
              Continue
            </Button>
          </Flex>
        </Flex>
      )}
      {...rest}
    >
      {[
        ...new Array(NB_OF_STEPS).fill(0).map((_, index) => (
          <FlowStepper.Step label={"Step " + index}>
            <Text key={index} variant="body">
              {lipsum}
            </Text>
            <Button mt={2} onClick={() => updateArgs({ activeIndex: NB_OF_STEPS })}>
              Navigate to the hidden step.
            </Button>
          </FlowStepper.Step>
        )),
        <FlowStepper.Step label="Hidden Step" hidden>
          <Text key="hidden" variant="body">
            I am hidden.
          </Text>
        </FlowStepper.Step>,
      ]}
    </FlowStepper>
  );
};

const Header = ({ activeIndex, onBack }: { activeIndex: number; onBack?: () => void }) => {
  return (
    <Box position="relative" my={6}>
      {onBack && (
        <Box position="absolute">
          <Link onClick={onBack} Icon={IconsLegacy.ArrowLeftMedium} iconPosition="left">
            Back
          </Link>
        </Box>
      )}
      <Flex justifyContent="center">
        <Text variant="h2">Header {activeIndex + 1}</Text>
      </Flex>
    </Box>
  );
};

const Footer = ({
  onContinue,
  children,
}: {
  onContinue?: () => void;
  children?: React.ReactNode;
}) => (
  <Flex mt={6} flexDirection="column" rowGap={6}>
    <Box alignSelf="stretch">
      <Divider />
    </Box>
    <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
      {children || <Flex />}
      {onContinue && (
        <Button variant="main" onClick={onContinue}>
          Continue
        </Button>
      )}
    </Flex>
  </Flex>
);

const AnimatedItem = styled(Flex)`
  transition: opacity 500ms;
  width: 100%;
  height: 100%;
  &.step-enter {
    opacity: 0;
  }
  &.step-enter-active {
    opacity: 1;
  }
  &.step-exit {
    opacity: 1;
  }
  &.step-exit-active {
    opacity: 0;
  }
`;
const Item = ({ label }: { label: string }) => (
  <AnimatedItem>
    <Flex
      position="absolute"
      left="0"
      right="0"
      top="0"
      bottom="0"
      alignItems="center"
      justifyContent="center"
      backgroundColor={`${label.toLowerCase()}.c50`}
    >
      <Text variant="h2" textTransform="capitalize">
        {label}
      </Text>
    </Flex>
  </AnimatedItem>
);

const steps = ["Primary", "Neutral", "Success", "Warning", "Error"];

const StepFooter = ({ label }: { label: string }) => (
  <Flex flexDirection="row" alignItems="center">
    <Text whiteSpace="pre">Footer for step </Text>
    <Tag size={"medium" as TagSize} type="plain" active>
      {label}
    </Tag>
  </Flex>
);

export const Demo: StoryTemplate<FlowStepperProps<unknown>> = args => {
  const [, updateArgs] = useArgs();

  return (
    <Flex height="90vh">
      <FlowStepper
        header={({ activeIndex }) => (
          <Header
            activeIndex={activeIndex}
            onBack={
              activeIndex > 0
                ? () => {
                    updateArgs({ activeIndex: activeIndex - 1 });
                  }
                : undefined
            }
          />
        )}
        renderStepFooter={({ stepsLength, activeIndex, children }) => (
          <Footer
            onContinue={
              activeIndex < stepsLength - 1
                ? () => {
                    updateArgs({ activeIndex: activeIndex + 1 });
                  }
                : undefined
            }
          >
            {children}
          </Footer>
        )}
        extraStepperContainerProps={{ my: 12 }}
        extraStepperProps={{ maxWidth: "500px" }}
        renderChildren={({ children }) => (
          <TransitionGroup component={null}>{children}</TransitionGroup>
        )}
        {...args}
      >
        {steps.map(label => (
          <CSSTransition
            key={label}
            label={label}
            footer={<StepFooter label={label} />}
            timeout={500}
            classNames="step"
            mountOnEnter
            unmountOnExit
          >
            <Item label={label} />
          </CSSTransition>
        ))}
      </FlowStepper>
    </Flex>
  );
};

const StepWithNavigation = (props: { label: string; setActiveStep: (arg: string) => void }) => {
  const { label, setActiveStep } = props;
  const content = useMemo(() => {
    return steps.map(step => {
      return (
        <Button
          key={step}
          disabled={step === label}
          variant="main"
          onClick={() => setActiveStep(step)}
        >
          Go to "{step}"
        </Button>
      );
    });
  }, [setActiveStep, label]);
  return (
    <Flex
      flex={1}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={4}
      rowGap={4}
      backgroundColor={`${label.toLowerCase()}.c50`}
    >
      {content}
    </Flex>
  );
};

export const IndexedByKey: StoryTemplate<FlowStepperProps<unknown>> = args => {
  const [activeStep, setActiveStep] = useState(steps[0]);
  return (
    <Flex height="90vh">
      <FlowStepper.Indexed
        activeKey={activeStep}
        header={({ activeIndex }) => (
          <Header
            activeIndex={activeIndex}
            onBack={
              activeIndex > 0
                ? () => {
                    setActiveStep(steps[activeIndex - 1]);
                  }
                : undefined
            }
          />
        )}
        footer={({ stepsLength, activeIndex }) => (
          <Footer
            onContinue={
              activeIndex < stepsLength - 1
                ? () => {
                    setActiveStep(steps[activeIndex + 1]);
                  }
                : undefined
            }
          />
        )}
        extraStepperContainerProps={{ my: 12 }}
        extraStepperProps={{ maxWidth: "500px" }}
        {...args}
      >
        {steps.map(label => (
          <FlowStepper.Indexed.Step key={label} label={label} itemKey={label}>
            <StepWithNavigation label={label} setActiveStep={setActiveStep} />
          </FlowStepper.Indexed.Step>
        ))}
      </FlowStepper.Indexed>
    </Flex>
  );
};
