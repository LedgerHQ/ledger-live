import React from "react";
import Log from "../../message/Log";
import GlitchText, { GlitchTextProps } from "./";

export default {
  title: "Animations/GlitchText",
  component: GlitchText,
  parameters: { actions: { argTypesRegex: false } },
  argTypes: {
    text: {
      type: "text",
    },
    duration: {
      type: "number",
    },
    delay: {
      type: "number",
    },
  },
};

const Template = (args: GlitchTextProps) => (
  <Log width="fit-content">
    The following text will <GlitchText {...args} />.
  </Log>
);

export const Default = Template.bind({});
// @ts-expect-error FIXME
Default.args = {
  text: "Glitch",
};
