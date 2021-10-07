import React from "react";
import LogComponent, { Props } from "./index";

export default {
  title: "Messages/Log",
  component: LogComponent,
  argTypes: {
    children: { type: "string", defaultValue: "Label" },
  },
};

export const Log = (args: Props): JSX.Element => {
  return <LogComponent {...args} />;
};
