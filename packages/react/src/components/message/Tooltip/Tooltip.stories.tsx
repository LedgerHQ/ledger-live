import React from "react";

import Text from "../../asorted/Text";
import FlexBox from "../../layout/Flex";
import TooltipComponent, { Props } from "./index";

export default {
  title: "Messages/Tooltip",
  component: TooltipComponent,
  argTypes: {
    content: { type: "string", defaultValue: "Hello World!" },
    visible: { type: "boolean" },
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
};

export const Tooltip = (args: Props): JSX.Element => (
  <FlexBox alignItems="center" justifyContent="center" style={{ height: "100vh" }}>
    <TooltipComponent {...args}>
      <div style={{ padding: "5px" }}>
        <Text
          as="div"
          ff="Inter|SemiBold"
          color="palette.neutral.c100"
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
