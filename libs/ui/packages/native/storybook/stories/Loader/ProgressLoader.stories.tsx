import React from "react";
import { action } from "@storybook/addon-actions";
import { Text, ProgressLoader } from "../../../src/components";
import { ComponentStory } from "@storybook/react-native";

export default {
  title: "Loader/ProgressLoader",
  component: ProgressLoader,
};

export const LoaderSample: ComponentStory<typeof ProgressLoader> = (
  args: typeof LoaderSampleArgs,
) => {
  return (
    <ProgressLoader
      progress={args.progress}
      infinite={args.infinite}
      onPress={action("onPress")}
      mainColor={args.mainColor}
      secondaryColor={args.secondaryColor}
      radius={args.radius}
      strokeWidth={args.strokeWidth}
      frontStrokeLinecap={args.frontStrokeLinecap}
    >
      {
        <Text textAlign="center">
          (children{"\n"} {args.progress * 100}%)
        </Text>
      }
    </ProgressLoader>
  );
};
LoaderSample.storyName = "ProgressLoader";
const LoaderSampleArgs = {
  progress: 0.5,
  infinite: false,
  mainColor: "",
  secondaryColor: "",
  radius: 48,
  strokeWidth: 10,
  frontStrokeLinecap: "butt" as const,
};
LoaderSample.args = LoaderSampleArgs;
LoaderSample.argTypes = {
  progress: {
    control: { type: "number", min: 0, max: 1, step: 0.1 },
  },
  frontStrokeLinecap: {
    options: ["butt", "round"],
    control: { type: "select" },
  },
};
