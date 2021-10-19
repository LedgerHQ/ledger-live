import React from "react";
import { storiesOf } from "../../storiesOf";
import { text } from "@storybook/addon-knobs";
import Tooltip from "@components/Layout/Modal/Tooltip";
import Text from "@components/Text";
import WarningLight from "@ui/assets/icons/WarningLight";

const TooltipStory = () => {
  return (
    <Tooltip
      title={text("title", "title")}
      description={text("description", "Description")}
      subtitle={text("subtitle", "Subtitle")}
      Icon={WarningLight}
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

storiesOf((story) =>
  story("Layout/Modal", module).add("Tooltip", TooltipStory)
);
