import React from "react";
import { Flex, InfiniteLoader } from "../../../src/components";

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

export default {
  title: "Loader/InfiniteLoader",
  component: InfiniteLoader,
  parameters: {
    docs: {
      title: "Selectable List",
      description: {
        component: description,
      },
    },
  },
};

export const InfiniteLoaderSample = (args: typeof InfiniteLoaderSampleArgs) => (
  <Flex flex={1} flexDirection={"row"}>
    <InfiniteLoader size={args.size} color={args.color} />
  </Flex>
);
InfiniteLoaderSample.storyName = "InfiniteLoader";
const InfiniteLoaderSampleArgs = {
  size: 38,
  color: "primary.c50",
};
InfiniteLoaderSample.args = InfiniteLoaderSampleArgs;
