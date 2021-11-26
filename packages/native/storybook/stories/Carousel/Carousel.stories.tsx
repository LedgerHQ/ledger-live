import React from "react";
import styled, { useTheme } from "styled-components/native";
import { storiesOf } from "../storiesOf";
import { Flex, Carousel, Text } from "../../../src";

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
    <Carousel>
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
    <Carousel autoDelay={2000}>
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
        backgroundColor: "neutral.c20",
      }}
      scrollViewProps={{
        borderRadius: 20,
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
);
