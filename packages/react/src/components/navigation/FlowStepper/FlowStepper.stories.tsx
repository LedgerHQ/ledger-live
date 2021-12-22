import React from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import styled from "styled-components";
import { useArgs } from "@storybook/client-api";
import { Props as FlowStepperProps } from "./index";
import { Divider, Flex, FlowStepper, Text, Button, Box, Link, Icons } from "../../..";
import { lipsum, StoryTemplate } from "../../helpers";

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

> Tip: To avoid creating specific passthrough components you can use the \`<FlowStepper.Step label="Step label">{…}</FlowStepper.Step>\` helper.

\`\`\`js
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
    activeIndex: { control: "number", defaultValue: 0 },
    extraProps: { control: "disabled" },
    extraContainerProps: { control: "disabled" },
    extraStepperProps: { control: "disabled" },
    extraStepperContainerProps: { control: "disabled" },
    children: { control: "disabled" },
    renderChildren: { control: "disabled" },
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
export const Minimal: StoryTemplate<FlowStepperProps<unknown>> = (args) => {
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
            <Divider variant="light" />
          </Box>
          <Flex columnGap={6}>
            <Button
              variant="main"
              outline
              disabled={activeIndex <= 0}
              onClick={() => updateArgs({ activeIndex: Math.floor(activeIndex) - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="main"
              disabled={activeIndex >= NB_OF_STEPS - 1}
              onClick={() => updateArgs({ activeIndex: Math.floor(activeIndex) + 1 })}
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
            <Button mt={2} onClick={() => updateArgs({ activeIndex: 1.5 })}>
              Navigate to the hidden step.
            </Button>
          </FlowStepper.Step>
        )),
        <FlowStepper.Step label="Hidden Step" index={1.5}>
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
          <Link onClick={onBack} Icon={Icons.ArrowLeftMedium} iconPosition="left">
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

const Footer = ({ onContinue }: { onContinue?: () => void }) => {
  return onContinue ? (
    <Flex mt={6} flexDirection="column" rowGap={6} alignItems="flex-end">
      <Box alignSelf="stretch">
        <Divider variant="light" />
      </Box>
      <Button variant="main" onClick={onContinue}>
        Continue
      </Button>
    </Flex>
  ) : null;
};

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

export const Demo: StoryTemplate<FlowStepperProps<unknown>> = (args) => {
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
        footer={({ stepsLength, activeIndex }) => (
          <Footer
            onContinue={
              activeIndex < stepsLength - 1
                ? () => {
                    updateArgs({ activeIndex: activeIndex + 1 });
                  }
                : undefined
            }
          />
        )}
        extraStepperContainerProps={{ my: 12 }}
        extraStepperProps={{ maxWidth: "500px" }}
        renderChildren={({ children }) => (
          <TransitionGroup component={null}>{children}</TransitionGroup>
        )}
        {...args}
      >
        {["Primary", "Neutral", "Success", "Warning", "Error"].map((label) => (
          <CSSTransition
            key={label}
            label={label}
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
