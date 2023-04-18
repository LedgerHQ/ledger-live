import React from "react";
import { Animated, ScrollView, StyleSheet, ImageSourcePropType, Platform } from "react-native";
import { RenderTransitionProps } from "../../../src/components/Navigation/FlowStepper";
import {
  FlowStepper,
  Flex,
  Button,
  Text,
  Transitions,
  Toggle,
  NumberInput,
} from "../../../src/components";
import { Icons } from "../../../src/assets";

const description = `
### A customizable flow layout.

This component accepts multiple children as steps and displays the active one as well a progress bar
and optionally a header and/or a footer.

It has been written to be easily animatable as demonstrated in the examples.

## Usage

\`\`\`js

import { FlowStepper } from "@ledgerhq/native-ui"
\`\`\`

## Props

\`\`\`tsx
interface Props<ExtraProps> {
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
   * **Use this prop in combination with \`transitionDuration\`.**
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
   * **Use this prop in combination with \`renderTransition\`.**
   *
   * If this prop is true and if \`renderTransition\` is used
   * then specifies the duration of the transition in milliseconds.
   */
  transitionDuration?: number;
  /**
   * A list of children representing each step of the flow.
   */
  children: React.ReactNode;
}
\`\`\`

## Minimal working example

\`\`\`tsx
// A nice full screen page using a specific color scheme.
const Item = ({ label }: { label: string }) => (
  <Flex
    flex={1}
    alignItems="center"
    justifyContent="center"
    backgroundColor={\`\${label}.c50\`}
  >
    <Text variant="h2" style={{ textTransform: "capitalize" }}>
      {label}
    </Text>
  </Flex>
);

// A header that displays the active index.
const Header = ({ activeIndex }: { activeIndex: number }) => {
  return (
    <Flex
      height={100}
      backgroundColor="primary.c80"
      justifyContent="center"
      alignItems="center"
    >
      <Text variant="h2" color="neutral.c00">
        {activeIndex}
      </Text>
    </Flex>
  );
};

const Minimal = (): JSX.Element => {
  const [index, setIndex] = React.useState(0);

  // Updates the active index every second.
  React.useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % 5), 1000);
    return () => clearInterval(interval);
  }, []);

  /* Each child represents a separate step of the flow.
     Only the active step is displayed at a given time. */
  return (
    <FlowStepper activeIndex={index} header={Header}>
      <Item label="primary" />
      <Item label="neutral" />
      <Item label="success" />
      <Item label="warning" />
      <Item label="error" />
    </FlowStepper>
  );
};
\`\`\`

## Transitions

You can use the \`renderTransition\` and \`transitionDuration\` props to perform transitions on the layout body.

The \`renderTransition\` prop is a render function that will get called for every child.
Depending on its \`status\` argument value (_entering_, _entered_, _exiting_ or _exited_) you can then use [Animated](https://reactnative.dev/docs/animated)
or various [animation libraries](https://docs.swmansion.com/react-native-reanimated/) to wrap the children and react to the status events.

For more information on this pattern, check out the [react-transition-group](https://reactcommunity.org/react-transition-group/transition) documentation.

<details>
<summary>\`renderTransition?: (props: RenderTransitionProps) => JSX.Element | null;\`</summary>

\`\`\`tsx
interface RenderTransitionProps {
  /**
   * The index of the child.
   */
  index: number;
  /**
   * The active index.
   */
  activeIndex: number;
  /**
   * The previously active index.
   */
  previousActiveIndex: number | null;
  /**
   * The total number of steps.
   */
  stepsLength: number;
  /**
   *  The status of the transition, either "entered", "entering", "exiting" or "exited".
   */
  status: TransitionStatus;
  /**
   * Duration used to transition between statuses.
   */
  duration: number;
  /**
   * Additional styles to pass to the underlying View wrapper.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Children that will get controlled by the transition.
   */
  children: React.ReactNode;
}
\`\`\`

</details>

### Presets

The \`Transitions\` import contains two transition presets, \`Transitions.Slide\` and \`Transitions.Fade\`.

<details>
<summary>Presets props</summary>

\`\`\`tsx
// Common transition props
interface TransitionProps {
  /**
   * The status of the transition, either "entered", "entering", "exiting" or "exited".
   */
  status: TransitionStatus;
  /**
   * Duration used to transition between statuses.
   */
  duration: number;
  /**
   * Additional styles to pass to the underlying View wrapper.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Children that will get controlled by the transition.
   */
  children: React.ReactNode;
}

// Extra Transition.Slide props
interface SlideProps extends TransitionProps {
  /**
   * The direction of the slide animation.
   */
  direction?: "left" | "right";
}
\`\`\`

</details>

\`\`\`tsx
import { FlowStepper, Transitions } from "@ledgerhq/native-ui";

// The duration of the transition.
const transitionDuration = 500;
// The render function that exposes the status and performs the animation.
const renderTransition = ({
  // Either 'entering', 'entered', 'exiting' or 'exited' depending on the visibility of the child.
  status,
  // The current active index.
  activeIndex,
  // The previous active index.
  previousActiveIndex,
  // The transition duration.
  duration,
  // The jsx contents of the step.
  children,
}: RenderTransitionProps) => (
  <Transitions.Slide
    status={status}
    duration={duration}
    direction={(previousActiveIndex || 0) < activeIndex ? "left" : "right"}
    style={[StyleSheet.absoluteFill, { flex: 1 }]}
  >
    {children}
  </Transitions.Slide>
);

// … //

<FlowStepper renderTransition={renderTransition} transitionDuration={transitionDuration} {...otherProps} />
\`\`\`


`;

export default {
  title: "Navigation/FlowStepper",
  component: FlowStepper,
};

/* Helpers */

const transitionStyles = [StyleSheet.absoluteFill, { flex: 1 }];
const renderTransitionFade = ({ status, duration, children }: RenderTransitionProps) => (
  <Transitions.Fade status={status} duration={duration} style={transitionStyles}>
    {children}
  </Transitions.Fade>
);
const renderTransitionSlide = ({
  activeIndex,
  previousActiveIndex,
  status,
  duration,
  children,
}: RenderTransitionProps) => (
  <Transitions.Slide
    status={status}
    duration={duration}
    direction={(previousActiveIndex || 0) < activeIndex ? "left" : "right"}
    style={transitionStyles}
  >
    {children}
  </Transitions.Slide>
);
const transitionPresets = [renderTransitionFade, renderTransitionSlide];
const transitionDuration = 500;
const lipsum =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi varius sollicitudin lectus vel finibus. Praesent eu leo nec libero interdum sodales et eget nulla. Donec tincidunt posuere sem vel porttitor. Nullam maximus urna non elit tempor, ut fermentum metus euismod. Quisque et rutrum arcu. Etiam nisl elit, tincidunt volutpat libero sed, imperdiet mollis risus. Maecenas imperdiet lectus id sapien tempus, eget fringilla nisl lacinia. Sed sem velit, egestas nec imperdiet ac, lobortis vel lectus. Curabitur dui orci, aliquam sit amet metus ut, sollicitudin fermentum erat. Curabitur id purus eget lectus varius congue. Donec eu auctor augue. Ut eleifend arcu nisl, volutpat fringilla quam cursus sit amet. Praesent leo enim, cursus vel egestas sed, vestibulum imperdiet diam. Etiam a diam lectus. Suspendisse aliquam imperdiet ultrices. Phasellus eget nulla eros. Nullam semper porta pulvinar. Duis maximus, lectus ac fringilla interdum, lacus ex cursus tellus, et dapibus est nisi id dolor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla gravida elit turpis, ac condimentum velit placerat at. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In dolor tellus, semper id pulvinar eget, ornare bibendum justo. Sed in libero nisl. Morbi tincidunt sollicitudin nunc, vel imperdiet nisi iaculis vel. Nam viverra lorem vel ligula varius, lacinia maximus metus porta. Sed vitae vehicula leo. Proin sed lectus in lorem laoreet iaculis sed ut eros. Pellentesque et rhoncus sapien. Nam fringilla mauris nec tellus vestibulum, vel convallis mauris sagittis. Vivamus et lacinia dui. Sed pharetra vitae lacus vel facilisis. Nullam et sollicitudin risus. Curabitur egestas bibendum neque, sed lacinia nisi cursus nec. Quisque sed diam congue, luctus magna eget, convallis lectus. Cras ut tellus imperdiet, blandit magna non, auctor felis. Suspendisse potenti. Nulla volutpat felis vitae ante blandit tempor. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nulla sagittis scelerisque magna quis ultrices";

/* Complete example */

const illustrations: { [key: number]: ImageSourcePropType } = {
  0: require("./illustration_0.png"),
  1: require("./illustration_1.png"),
  2: require("./illustration_2.png"),
};
const ImageHeader = ({
  activeIndex,
  onBack,
}: {
  activeIndex: number;
  onBack: (() => void) | null;
}) => {
  const firstRender = React.useRef(true);
  const [source, setSource] = React.useState(illustrations[activeIndex]);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const fadeIn = React.useMemo(
    () =>
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: transitionDuration,
        useNativeDriver: true,
      }),
    [fadeAnim],
  );

  const fadeOut = React.useMemo(
    () =>
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: transitionDuration,
        useNativeDriver: true,
      }),
    [fadeAnim],
  );

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    fadeOut.start(({ finished }) => {
      if (!finished) return;
      setSource(illustrations[activeIndex]);
      fadeIn.start();
    });
    return () => {
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim, fadeIn, fadeOut, activeIndex]);

  return (
    <Flex flex={0.5} backgroundColor="primary.c50">
      <Flex alignItems="flex-start" width="100%" height={30}>
        {onBack && <Button Icon={Icons.ArrowLeftMedium} onPress={onBack} />}
      </Flex>
      {Platform.OS === "web" ? (
        <Animated.Image
          source={source}
          resizeMode="contain"
          style={{ flex: 1, margin: 30, marginTop: 0, opacity: fadeAnim }}
        />
      ) : (
        <Flex flex={1} mb={30} mx={8} justifyContent="center" alignItems="center">
          <Animated.Image
            source={source}
            resizeMode="contain"
            style={{ flex: 1, opacity: fadeAnim }}
          />
        </Flex>
      )}
    </Flex>
  );
};

const BodyItem = ({ title, onNext }: { title: string; onNext?: () => void }): JSX.Element => (
  <Flex flex={1} p={8} backgroundColor="neutral.c00" justifyContent="space-between">
    <Flex flex={1}>
      <Text variant="h2" style={{ textTransform: "capitalize" }}>
        {title}
      </Text>
      <ScrollView style={{ flex: 1, marginTop: 16, marginBottom: 16 }}>
        <Text>{lipsum}</Text>
      </ScrollView>
    </Flex>
    {onNext && (
      <Button type="main" onPress={onNext}>
        Continue
      </Button>
    )}
  </Flex>
);

export const Demo = (): JSX.Element => {
  const [index, setIndex] = React.useState(0);
  return (
    <Flex flex={1} width="100%">
      <FlowStepper
        activeIndex={index}
        header={ImageHeader}
        footer={() => (
          <Flex mb={4} flexDirection="row" justifyContent="center">
            <Text variant="tiny">Copyright © Ledger SAS. All rights reserved.</Text>
          </Flex>
        )}
        extraProps={{
          onBack: index === 0 ? null : () => setIndex((index) => index - 1),
        }}
        renderTransition={renderTransitionSlide}
        transitionDuration={transitionDuration}
      >
        <BodyItem title="First Slide" onNext={() => setIndex(1)} />
        <BodyItem title="Second Slide" onNext={() => setIndex(2)} />
        <BodyItem title="Third Slide" />
      </FlowStepper>
    </Flex>
  );
};
Demo.storyName = "Flow Stepper Demo";
Demo.parameters = {
  docs: {
    description: {
      component: description,
    },
  },
};

/* Minimal example */

const Item = ({ label }: { label: string }) => (
  <Flex flex={1} alignItems="center" justifyContent="center" backgroundColor={`${label}.c50`}>
    <Text variant="h2" style={{ textTransform: "capitalize" }}>
      {label}
    </Text>
  </Flex>
);

const Header = ({ activeIndex }: { activeIndex: number }) => {
  const label =
    activeIndex === 0
      ? "One"
      : activeIndex === 1
      ? "Two"
      : activeIndex === 2
      ? "Three"
      : activeIndex === 3
      ? "Four"
      : activeIndex === 4
      ? "Five"
      : "";
  return (
    <Flex height={100} backgroundColor="primary.c80" justifyContent="center" alignItems="center">
      <Text variant="h2" color="neutral.c00">
        {label}
      </Text>
    </Flex>
  );
};

export const Minimal = (args: typeof MinimalArgs): JSX.Element => {
  return (
    <Flex width="90%" flex={0.9}>
      <FlowStepper activeIndex={args.index} header={Header}>
        <Item label="primary" />
        <Item label="neutral" />
        <Item label="success" />
        <Item label="warning" />
        <Item label="error" />
      </FlowStepper>
    </Flex>
  );
};
Minimal.storyName = "Flow Stepper (minimal)";
const MinimalArgs = {
  index: 0,
};
Minimal.args = MinimalArgs;
Minimal.parameters = {
  docs: {
    description: {
      story: `A minimal story.`,
    },
  },
};

/* Transition Preset Example */

export const TransitionPreset = (): JSX.Element => {
  const [index, setIndex] = React.useState(1);
  const [duration, setDuration] = React.useState(500);
  const [transitionPresetIndex, setTransitionPresetIndex] = React.useState(0);
  const renderTransition = transitionPresets[transitionPresetIndex];

  return (
    <Flex
      width="90%"
      flex={0.9}
      borderWidth={4}
      borderColor="neutral.c100"
      style={{ borderRadius: 20 }}
      overflow="hidden"
    >
      <FlowStepper
        activeIndex={index}
        header={Header}
        renderTransition={renderTransition}
        transitionDuration={duration}
      >
        <Item label="primary" />
        <Item label="neutral" />
        <Item label="success" />
        <Item label="warning" />
        <Item label="error" />
      </FlowStepper>
      <Flex
        px={4}
        pt={4}
        mt={-4}
        ml={-4}
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
      >
        <Flex ml={4} mt={4}>
          <Toggle
            active={transitionPresetIndex === 0}
            onPress={() => {
              setTransitionPresetIndex(0);
            }}
          >
            Fade
          </Toggle>
        </Flex>
        <Flex ml={4} mt={4}>
          <Toggle
            active={transitionPresetIndex === 1}
            onPress={() => {
              setTransitionPresetIndex(1);
            }}
          >
            Slide
          </Toggle>
        </Flex>
        <Flex flex={1} minWidth={300} ml={4} mt={4}>
          <NumberInput
            value={duration}
            onChange={(value) => setDuration(value || 0)}
            onPercentClick={(percent: number) => {
              setDuration(2000 * percent);
            }}
            placeholder={"Placeholder"}
            min={0}
            max={2000}
          />
        </Flex>
      </Flex>
      <Flex flexDirection="row" justifyContent="space-around">
        <Button onPress={() => setIndex((i) => Math.max(0, (i || 0) - 1))}>-</Button>
        <Button onPress={() => setIndex((i) => Math.min(4, (i || 0) + 1))}>+</Button>
      </Flex>
    </Flex>
  );
};
TransitionPreset.storyName = "Flow Stepper (transition preset)";
TransitionPreset.parameters = {
  docs: {
    description: {
      story: `A story that demonstrates how to use transition presets.`,
    },
  },
};

/* Custom Transition Example */

const customTransitionDescription = `
The following example shows how to write a custom transition (without preset) based on the \`renderTransition\` function.

\`\`\`tsx
function TransitionComponent({
  status,
  duration,
  style,
  children,
}: RenderTransitionProps) {
  const animateRef = React.useRef(
    new Animated.Value(status === "entered" ? 1 : 0)
  ).current;

  const animateIn = React.useMemo(
    () =>
      Animated.timing(animateRef, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    [duration, animateRef]
  );

  const animateOut = React.useMemo(
    () =>
      Animated.timing(animateRef, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    [duration, animateRef]
  );

  React.useEffect(() => {
    if (status === "entering") {
      animateIn.start();
    }
    if (status === "exiting") {
      animateOut.start();
    }
  }, [animateIn, animateOut, status]);

  return (
    <Animated.View
    style={[
        {
          // Wild stuff…
          transform: [
            {
              scaleX: animateRef,
            },
            {
              scaleY: animateRef,
            },
            {
              rotateY: animateRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
            { perspective: 1000 },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const CustomTransition = (): JSX.Element => {
  const [index, setIndex] = React.useState(1);

  return (
    <FlowStepper
      activeIndex={index}
      // The transition component is used below:
      renderTransition={(props: RenderTransitionProps) => (
        <TransitionComponent
          {...props}
          style={[StyleSheet.absoluteFill, { flex: 1 }]}
        />
      )}
      transitionDuration={1000}
    >
      <Item label="primary" />
      <Item label="neutral" />
      <Item label="success" />
      <Item label="warning" />
      <Item label="error" />
    </FlowStepper>
  );
};
\`\`\`
`;

function TransitionComponent({ status, duration, style, children }: RenderTransitionProps) {
  const animateRef = React.useRef(new Animated.Value(status === "entered" ? 1 : 0)).current;

  const animateIn = React.useMemo(
    () =>
      Animated.timing(animateRef, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    [duration, animateRef],
  );

  const animateOut = React.useMemo(
    () =>
      Animated.timing(animateRef, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    [duration, animateRef],
  );

  React.useEffect(() => {
    if (status === "entering") {
      animateIn.start();
    }
    if (status === "exiting") {
      animateOut.start();
    }
  }, [animateIn, animateOut, status]);

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              scaleX: animateRef,
            },
            {
              scaleY: animateRef,
            },
            {
              rotateY: animateRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
            { perspective: 1000 },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export const CustomTransition = (): JSX.Element => {
  const [index, setIndex] = React.useState(1);

  return (
    <Flex
      width="90%"
      flex={0.9}
      borderWidth={4}
      borderColor="neutral.c100"
      style={{ borderRadius: 20 }}
      overflow="hidden"
    >
      <FlowStepper
        activeIndex={index}
        renderTransition={(props: RenderTransitionProps) => (
          <TransitionComponent {...props} style={[StyleSheet.absoluteFill, { flex: 1 }]} />
        )}
        transitionDuration={1000}
      >
        <Item label="primary" />
        <Item label="neutral" />
        <Item label="success" />
        <Item label="warning" />
        <Item label="error" />
      </FlowStepper>
      <Flex flexDirection="row" justifyContent="space-around">
        <Button onPress={() => setIndex((i) => Math.max(0, (i || 0) - 1))}>-</Button>
        <Button onPress={() => setIndex((i) => Math.min(4, (i || 0) + 1))}>+</Button>
      </Flex>
    </Flex>
  );
};
CustomTransition.storyName = "Flow Stepper (custom transition)";
CustomTransition.parameters = {
  docs: {
    description: {
      story: customTransitionDescription,
    },
  },
};
