import React from "react";
import InfiniteLoader, { Props } from "./index";

export default {
  title: "Loaders/InfiniteLoader",
  component: InfiniteLoader,
  argTypes: {
    size: {
      type: "number",
    },
  },
};

export const Default = (args: Props): JSX.Element => {
  return <InfiniteLoader size={args.size} />;
};
