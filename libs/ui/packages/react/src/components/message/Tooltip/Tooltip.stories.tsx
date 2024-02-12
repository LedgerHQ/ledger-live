import React from "react";
import { StoryTemplate } from "src/components/helpers";

import Text from "../../asorted/Text";
import FlexBox from "../../layout/Flex";
import TooltipComponent, { Props } from "./index";

const description = `
### Tooltips display informative text when users hover over an element.

This component is based on [tippyjs](https://atomiks.github.io/tippyjs/) which is powerful library.
Please check [the documentation](https://github.com/atomiks/tippyjs-react#-props) for the full props list and usage.

## Usage

\`\`\`js

import { Tooltip } from "@ledgerhq/react-ui"

\`\`\`

Wrap some jsx that will make the tooltip visible on mouse over.<br/>
_**Note:** this jsx will automatically be wrapped inside a \`span\` element if the ref cannot be forwarded. \
See [here](https://github.com/atomiks/tippyjs-react#component-children) for a detailed explanation._

To set the tooltip inner contents, use the \`content\` prop.

\`\`\`js
<Tooltip content="Hello!" {...props}>
  <div>Hover me</div>
</Tooltip>
\`\`\`

## Sandbox

Placement, style and content can be customized using props as demonstrated in the following example.
`;

export default {
  title: "Messages/Tooltip",
  component: TooltipComponent,
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    content: { type: "string" },
    visible: { options: [true, false, undefined] },
    disabled: { type: "boolean" },
    placement: {
      control: { type: "radio" },
      options: [
        "top",
        "top-start",
        "top-end",
        "right",
        "right-start",
        "right-end",
        "bottom",
        "bottom-start",
        "bottom-end",
        "left",
        "left-start",
        "left-end",
        "auto",
        "auto-start",
        "auto-end",
      ],
    },
  },
  args: {
    content: "Hello World!",
  },
};

export const Tooltip: StoryTemplate<Props> = args => (
  <FlexBox alignItems="center" justifyContent="center">
    <TooltipComponent {...args}>
      <div style={{ margin: "50px" }}>
        <Text
          as="div"
          fontWeight="semiBold"
          color="neutral.c100"
          style={{ border: "2px solid #AAA", borderRadius: "5px" }}
          p={10}
          textAlign="center"
        >
          Hover
          <br />
          me
        </Text>
      </div>
    </TooltipComponent>
  </FlexBox>
);
