import React from "react";
import LogComponent, { Props } from "./index";

export default {
  title: "Messages/Log",
  component: LogComponent,
  argTypes: {
    children: {
      type: "string",
    },
  },
  args: {
    children:
      "oh my mattis, oh my word. very dolor! very layout. plz aenean, much doge, oh my word. oh my elit, i can haz full. such layout. oh my word. want text",
  },
};

export const Log = (args: Props): JSX.Element => {
  return <LogComponent {...args} />;
};
