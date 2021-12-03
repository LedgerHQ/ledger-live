import React from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  ImageSourcePropType,
  Platform,
} from "react-native";
import { number } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { RenderTransitionProps } from "../../../src/components/Navigation/FlowStepper";
import {
  FlowStepper,
  Flex,
  Button,
  Text,
  Transitions,
  Icons,
} from "../../../src";

const description = `
### A customizable flow layout.

This layout is designed to accept multiple steps and display the current one
as well a progress bar and optionally an header and/or a footer.

This component has also been written to be easily animatable as demonstrated in the examples.

## Usage

\`\`\`js

import { FlowStepper } from "@ledgerhq/native-ui"
\`\`\`

## Minimal working example

\`\`\`tsx
// A nice full screen page with a given color scheme.
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

// A header that displays the page index.
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

Set the \`renderTransition\` and \`transitionDuration\`props to perform transitions on the layout body.

### Presets

The \`Transitions\` import contains two transition presets, \`Transitions.Slide\` and \`Transitions.Fade\`.

\`\`\`tsx
import { Transitions } from "@ledgerhq/native-ui";

const transitionDuration = 500;
const renderTransition = ({
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
    style={[StyleSheet.absoluteFill, { flex: 1 }]}
  >
    {children}
  </Transitions.Slide>
);
\`\`\`
`;

/* Minimal example */

const Item = ({ label }: { label: string }) => (
  <Flex
    flex={1}
    alignItems="center"
    justifyContent="center"
    backgroundColor={`${label}.c50`}
  >
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
    <Flex
      height={100}
      backgroundColor="primary.c80"
      justifyContent="center"
      alignItems="center"
    >
      <Text variant="h2" color="neutral.c00">
        {label}
      </Text>
    </Flex>
  );
};

const Minimal = (): JSX.Element => {
  return (
    <Flex width="90%" flex={0.9}>
      <FlowStepper activeIndex={number("index", 0)} header={Header}>
        <Item label="primary" />
        <Item label="neutral" />
        <Item label="success" />
        <Item label="warning" />
        <Item label="error" />
      </FlowStepper>
    </Flex>
  );
};

/* Animated example */

const renderTransition = ({
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
    style={[StyleSheet.absoluteFill, { flex: 1 }]}
  >
    {children}
  </Transitions.Slide>
);
const transitionDuration = 500;

const AnimatedExample = (): JSX.Element => {
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
        header={Header}
        renderTransition={renderTransition}
        transitionDuration={transitionDuration}
      >
        <Item label="primary" />
        <Item label="neutral" />
        <Item label="success" />
        <Item label="warning" />
        <Item label="error" />
      </FlowStepper>
      <Flex flexDirection="row" justifyContent="space-around">
        <Button onPress={() => setIndex((i) => Math.max(0, (i || 0) - 1))}>
          -
        </Button>
        <Button onPress={() => setIndex((i) => Math.min(4, (i || 0) + 1))}>
          +
        </Button>
      </Flex>
    </Flex>
  );
};

/* Complete example */

export const lipsum =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi varius sollicitudin lectus vel finibus. Praesent eu leo nec libero interdum sodales et eget nulla. Donec tincidunt posuere sem vel porttitor. Nullam maximus urna non elit tempor, ut fermentum metus euismod. Quisque et rutrum arcu. Etiam nisl elit, tincidunt volutpat libero sed, imperdiet mollis risus. Maecenas imperdiet lectus id sapien tempus, eget fringilla nisl lacinia. Sed sem velit, egestas nec imperdiet ac, lobortis vel lectus. Curabitur dui orci, aliquam sit amet metus ut, sollicitudin fermentum erat. Curabitur id purus eget lectus varius congue. Donec eu auctor augue. Ut eleifend arcu nisl, volutpat fringilla quam cursus sit amet. Praesent leo enim, cursus vel egestas sed, vestibulum imperdiet diam. Etiam a diam lectus. Suspendisse aliquam imperdiet ultrices. Phasellus eget nulla eros. Nullam semper porta pulvinar. Duis maximus, lectus ac fringilla interdum, lacus ex cursus tellus, et dapibus est nisi id dolor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla gravida elit turpis, ac condimentum velit placerat at. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In dolor tellus, semper id pulvinar eget, ornare bibendum justo. Sed in libero nisl. Morbi tincidunt sollicitudin nunc, vel imperdiet nisi iaculis vel. Nam viverra lorem vel ligula varius, lacinia maximus metus porta. Sed vitae vehicula leo. Proin sed lectus in lorem laoreet iaculis sed ut eros. Pellentesque et rhoncus sapien. Nam fringilla mauris nec tellus vestibulum, vel convallis mauris sagittis. Vivamus et lacinia dui. Sed pharetra vitae lacus vel facilisis. Nullam et sollicitudin risus. Curabitur egestas bibendum neque, sed lacinia nisi cursus nec. Quisque sed diam congue, luctus magna eget, convallis lectus. Cras ut tellus imperdiet, blandit magna non, auctor felis. Suspendisse potenti. Nulla volutpat felis vitae ante blandit tempor. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nulla sagittis scelerisque magna quis ultrices";

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
    [fadeAnim]
  );

  const fadeOut = React.useMemo(
    () =>
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: transitionDuration,
        useNativeDriver: true,
      }),
    [fadeAnim]
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
        <Flex
          flex={1}
          mb={30}
          mx={8}
          justifyContent="center"
          alignItems="center"
        >
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

const BodyItem = ({
  title,
  onNext,
}: {
  title: string;
  onNext?: () => void;
}): JSX.Element => (
  <Flex
    flex={1}
    p={8}
    backgroundColor="neutral.c00"
    justifyContent="space-between"
  >
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

const Demo = (): JSX.Element => {
  const [index, setIndex] = React.useState(0);
  return (
    <Flex flex={1} width="100%">
      <FlowStepper
        activeIndex={index}
        header={ImageHeader}
        footer={() => (
          <Flex mb={4} flexDirection="row" justifyContent="center">
            <Text variant="tiny">
              Copyright © Ledger SAS. All rights reserved.
            </Text>
          </Flex>
        )}
        extraProps={{
          onBack: index === 0 ? null : () => setIndex((index) => index - 1),
        }}
        renderTransition={renderTransition}
        transitionDuration={transitionDuration}
      >
        <BodyItem title="First Slide" onNext={() => setIndex(1)} />
        <BodyItem title="Second Slide" onNext={() => setIndex(2)} />
        <BodyItem title="Third Slide" />
      </FlowStepper>
    </Flex>
  );
};

storiesOf((story) =>
  story("Navigation/FlowStepper", module)
    .add("Demo", Demo, {
      docs: {
        description: {
          component: description,
        },
      },
    })
    .add("Minimal", Minimal)
    .add("Animated", AnimatedExample)
);
