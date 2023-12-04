import React from "react";
import baseStyled, { BaseStyledProps } from "./styled";

export default {
  title: "Styled/BaseStyled",
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
        component: `The baseStyled function is a wrapper to "styled" from [styled-components](https://styled-components.com/) that lets you write these common css properties to your component more succinctly and inline.
        
It acts like a drop-in remplacement of styled. In your styled component, just replace styled with baseStyled, and the component will includes all the style props exported by the color, layout, position, shadow and flexbox utilities from the [styled-system](https://styled-system.com) library.
      
[See more about styled-system utilities](https://styled-system.com/api)`,
      },
    },
  },
};

const Block = baseStyled.div``;

export const Styled = (args: BaseStyledProps) => (
  <Block {...args}>
    A plain good ol'block with fixed width, backgroundColor, padding and margin, all by using inline
    props
  </Block>
);
