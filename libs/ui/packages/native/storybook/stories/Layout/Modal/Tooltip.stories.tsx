import React from "react";
import { StoryFn } from "@storybook/react";
import Tooltip from "../../../../src/components/Layout/Modals/Tooltip";
import Text from "../../../../src/components/Text";
import { IconsLegacy } from "../../../../src/assets";

export default {
  title: "Layout/Modal/Tooltip",
  component: Tooltip,
};

export const Default: StoryFn<typeof Tooltip> = (args: typeof DefaultArgs) => {
  return (
    <Tooltip
      title={args.title}
      description={args.description}
      subtitle={args.subtitle}
      Icon={IconsLegacy.WarningMedium}
      tooltipContent={
        <>
          <Text>Tooltip323</Text>
          <Text>Tooltip2323</Text>
        </>
      }
    >
      <Text>Click on me !</Text>
    </Tooltip>
  );
};
Default.storyName = "Tooltip";
const DefaultArgs = {
  title: "title",
  description: "Description",
  subtitle: "Subtitle",
};
Default.args = DefaultArgs;
