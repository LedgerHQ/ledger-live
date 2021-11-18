import React from "react";
import Box, { BoxProps } from ".";
export default {
  title: "Layout/Box",
  component: Box,
  argTypes: {
    backgroundColor: {
      type: "text",
      control: "color",
      defaultValue: "#0EBDCD",
      description:
        "This property defines the backgroundColor of the box. This property any color format.",
    },
    width: {
      type: "text",
      defaultValue: "200px",
      description: "Width of the box.",
    },
    py: {
      type: "text",
      defaultValue: "20px",
      description: "Padding top and bottom.",
    },
    mx: {
      type: "text",
      defaultValue: "20px",
      description: "Margin left and right.",
    },
  },
  parameters: {
    docs: {
      description: {
        component: `The Box component is a helper component that lets you write these common css properties more succinctly and inline.
      
It include all the style props exported by the color, layout, position, shadow utilities, and some of the flexbox utility, from the [styled-system](https://styled-system.com) library.
      
[See more about styled-system utilities](https://styled-system.com/api)`,
      },
    },
    actions: { argTypesRegex: false },
  },
};

const Template = (args: BoxProps) => (
  <Box {...args}>
    A plain good ol'box with fixed width, backgroundColor, padding and margin, all by using inline
    props
  </Box>
);

export const Default = Template.bind({});
