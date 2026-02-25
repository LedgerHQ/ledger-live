import React from "react";
import Tip, { TipProps } from "./index";

export default {
  title: "Messages/Tips",
  argTypes: {
    type: {
      options: ["success", "warning", "error", undefined],
      control: {
        type: "radio",
      },
    },
    label: {
      control: {
        type: "text",
      },
    },
  },
  args: {
    type: "sucess",
    label: "Label",
  },
};

export const Default = (args: TipProps): JSX.Element => {
  return <Tip {...args} />;
};
