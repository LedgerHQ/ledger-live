import React from "react";
import { storiesOf } from "../storiesOf";
import { Flex, InfiniteLoader } from "../../../src";
import { color, number } from "@storybook/addon-knobs";

const description = `
### Spinner Component

A simple spinner component with customizable size and color 🎡.

## Usage

\`\`\`js
import { InfiniteLoader } from "@ledgerhq/native-ui"

/*
  Both color and size are optional.
  Extra props are passed to the child <svg> tag.
*/
<InfiniteLoader size={40} color="warning.c50" />
\`\`\`
`;

const InfiniteLoaderSample = () => (
  <Flex flex={1} flexDirection={"row"}>
    <InfiniteLoader size={number("length", 38)} color={color("color", "primary.c50")} />
  </Flex>
);

storiesOf((story) =>
  story("Loader", module).add("InfiniteLoader", InfiniteLoaderSample, {
    docs: {
      title: "Selectable List",
      description: {
        component: description,
      },
    },
  }),
);
