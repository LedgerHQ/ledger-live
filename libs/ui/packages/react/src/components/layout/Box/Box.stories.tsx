import React from "react";
import Box, { BoxProps } from ".";
export default {
  title: "Layout/Box",
  component: Box,
  argTypes: {
    backgroundColor: {
      type: "text",
      control: "color",
      description:
        "This property defines the backgroundColor of the box. This property any color format.",
    },
    width: {
      type: "text",
      description: "Width of the box.",
    },
    py: {
      type: "text",
      description: "Padding top and bottom.",
    },
    px: {
      type: "text",
      description: "Padding left and right.",
    },
    mx: {
      type: "text",
      description: "Margin left and right.",
    },
  },
  args: {
    backgroundColor: "#0EBDCD",
    width: "200px",
    py: "20px",
    px: "20px",
    mx: "20px",
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
