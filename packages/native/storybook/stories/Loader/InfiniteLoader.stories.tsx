import React from "react";
import { storiesOf } from "../storiesOf";
import { InfiniteLoader } from "../../../src";
import { color, number } from "@storybook/addon-knobs";

const description = `
### Spinner Component
A simple spinner component with customizable size and color 🎡.
## Usage
\`\`\`js
import { InfiniteLoader } from "@ledgerhq/native-ui"
\`\`\`
\`\`\`js
/*
  Both color and size are optional.
  Extra props are passed to the child <svg> tag.
*/
<InfiniteLoader size={40} color="warning.c50" />
\`\`\`
`;

const InfiniteLoaderSample = () => (
  <InfiniteLoader
    size={number("length", 38)}
    color={color("color", "primary.c50")}
  />
);

storiesOf((story) =>
  story("Loader", module).add("InfiniteLoader", InfiniteLoaderSample, {
    docs: {
      title: "Selectable List",
      description: {
        component: description,
      },
    },
  })
);
