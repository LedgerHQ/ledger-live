import React from "react";
import InfiniteLoader, { Props } from "./index";

const description = `
### Spinner Component

A simple spinner component with customizable size and color 🎡.

## Usage

\`\`\`js

import { InfiniteLoader } from "@ledgerhq/react-ui"
\`\`\`

\`\`\`js
/*
  Both color and size are optional.
  Extra props are passed to the child <svg> tag.
*/
<InfiniteLoader size={40} color="warning.c20" />
\`\`\`
`;

export default {
  title: "Loaders/InfiniteLoader",
  component: InfiniteLoader,
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    size: {
      type: "number",
    },
    color: {
      control: {
        type: "color",
        presetColors: ["coral", "tomato", "orange", "blue", "purple"],
      },
    },
    theme: {
      table: { disable: true },
    },
    as: {
      table: { disable: true },
    },
    forwardedAs: {
      table: { disable: true },
    },
  },
};

export const Default = (args: Props): JSX.Element => {
  return <InfiniteLoader {...args} />;
};
