import React from "react";
import ProgressLoader, { Props } from "./index";

export default {
  title: "Loaders/ProgressLoader",
  component: ProgressLoader,
  argTypes: {
    radius: {
      control: {
        type: "number",
      },
      defaultValue: 32,
    },
    progress: {
      control: {
        type: "number",
      },
      defaultValue: 20,
    },
    stroke: {
      control: {
        type: "number",
      },
      defaultValue: 6,
    },
    showPercentage: {
      defaultValue: true,
      control: {
        type: "boolean",
      },
    },
    frontStrokeColor: {
      type: "string",
      control: {
        control: "color",
      },
    },
    backgroundStrokeColor: {
      type: "string",
      control: {
        control: "color",
      },
    },
    textColor: {
      type: "string",
      control: {
        control: "color",
      },
    },
  },
};

export const Default = (args: Props): JSX.Element => {
  return (
    <ProgressLoader
      radius={args.radius}
      progress={args.progress}
      stroke={args.stroke}
      showPercentage={args.showPercentage}
      frontStrokeColor={args.frontStrokeColor}
      backgroundStrokeColor={args.backgroundStrokeColor}
      frontStrokeLinecap={args.frontStrokeLinecap}
      textColor={args.textColor}
    />
  );
};
