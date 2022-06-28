import React from "react";
import styled, { useTheme } from "styled-components/native";
import { number, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import { storiesOf } from "../storiesOf";
import { Flex, Carousel, Text, Button } from "../../../src";
import StoriesIndicator from "../../../src/components/Navigation/StoriesIndicator";

const description = `
### A simple responsive carousel.

This simple carousel implementation component allows the user to swipe horizontally through its children
displayed as full screen elements.

It also displays a list of toucheable bullet indicators below the carousel to navigate to a specific element,
show the current position of the carousel and the total number of items.

This components accepts various props to style the different parts of the UI and to customize the scroll behaviour.

## Usage

\`\`\`js

import { Carousel } from "@ledgerhq/native-ui"
\`\`\`


\`\`\`js
const Item = ({ label }: { label: string }) => (
  <ChildContainer backgroundColor={\`\${label}.c50\`}>
    <Text variant="h2" style={{ textTransform: "capitalize" }}>
      {label}
    </Text>
  </ChildContainer>
);

const Default = (): JSX.Element => {
  return (
    <Carousel>
      <Item label="primary" />
      <Item label="neutral" />
      <Item label="success" />
      <Item label="warning" />
      <Item label="error" />
    </Carousel>
  );
};
\`\`\`
`;

const ChildContainer = styled(Flex).attrs({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
})``;

const Item = ({ label }: { label: string }) => (
  <ChildContainer backgroundColor={`${label}.c50`}>
    <Text variant="h2" style={{ textTransform: "capitalize" }}>
      {label}
    </Text>
  </ChildContainer>
);

const Default = (): JSX.Element => {
  return (
    <Carousel
      scrollViewProps={{
        style: { width: "100%" },
      }}
    >
      <Item label="primary" />
      <Item label="neutral" />
      <Item label="success" />
      <Item label="warning" />
      <Item label="error" />
    </Carousel>
  );
};

const AutoDelay = (): JSX.Element => {
  return (
    <Carousel
      autoDelay={2000}
      scrollViewProps={{
        style: {
          width: "100%",
        },
      }}
    >
      <Item label="primary" />
      <Item label="neutral" />
      <Item label="success" />
      <Item label="warning" />
      <Item label="error" />
    </Carousel>
  );
};

const WithProps = (): JSX.Element => {
  const theme = useTheme();
  return (
    <Carousel
      containerProps={{
        p: 10,
        backgroundColor: "red",
      }}
      scrollViewProps={{
        style: { borderRadius: 20, width: "100%" },
      }}
      slideIndicatorContainerProps={{
        p: 4,
        style: { borderRadius: 20 },
        backgroundColor: theme.colors.error.c100,
      }}
    >
      <Item label="primary" />
      <Item label="neutral" />
      <Item label="success" />
      <Item label="warning" />
      <Item label="error" />
    </Carousel>
  );
};

const Controlled = (): JSX.Element => {
  const [forceActiveIndex, setForceActiveIndex] = React.useState(2);
  const [carouselIndex, setCarouselIndex] = React.useState(2);

  return (
    <>
      <Carousel
        activeIndex={forceActiveIndex}
        onChange={setCarouselIndex}
        scrollViewProps={{
          style: {
            width: "100%",
          },
        }}
      >
        <Item label="primary" />
        <Item label="neutral" />
        <Item label="success" />
        <Item label="warning" />
        <Item label="error" />
      </Carousel>
      <Text variant="h3">Active index: {carouselIndex}</Text>
      <Text variant="h3">Navigate programatically to index</Text>
      <Flex flexDirection="row">
        <Button onPress={() => setForceActiveIndex(0)}>0</Button>
        <Button onPress={() => setForceActiveIndex(1)}>1</Button>
        <Button onPress={() => setForceActiveIndex(2)}>2</Button>
        <Button onPress={() => setForceActiveIndex(3)}>3</Button>
        <Button onPress={() => setForceActiveIndex(4)}>4</Button>
      </Flex>
    </>
  );
};

const CustomIndicator = (): JSX.Element => {
  return (
    <Carousel
      scrollOnSidePress={boolean("scrollOnSidePress", true)}
      autoDelay={number("autoDelay", 5000)}
      restartAfterEnd={boolean("restartAfterEnd", false)}
      IndicatorComponent={StoriesIndicator}
      onOverflow={action("onOverflow")}
      onChange={action("onChange")}
      scrollViewProps={{
        style: {
          width: "100%",
        },
      }}
      slideIndicatorContainerProps={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        px: 7,
      }}
    >
      <Item label="primary" />
      <Item label="neutral" />
      <Item label="success" />
      <Item label="warning" />
      <Item label="error" />
    </Carousel>
  );
};

storiesOf((story) =>
  story("Carousel", module)
    .add("Default", Default, {
      docs: {
        title: "Default",
        description: {
          component: description,
        },
      },
    })
    .add("AutoDelay", AutoDelay)
    .add("WithProps", WithProps)
    .add("Controlled", Controlled)
    .add("CustomIndicator - Story", CustomIndicator),
);
