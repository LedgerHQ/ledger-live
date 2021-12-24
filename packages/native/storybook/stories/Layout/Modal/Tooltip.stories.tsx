import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../../storiesOf";
import Tooltip from "../../../../src/components/Layout/Modals/Tooltip";
import Text from "../../../../src/components/Text";
import { Icons } from "../../../../src/assets";

const TooltipStory = () => {
  return (
    <Tooltip
      title={text("title", "title")}
      description={text("description", "Description")}
      subtitle={text("subtitle", "Subtitle")}
      Icon={Icons.WarningLight}
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

storiesOf((story) => story("Layout/Modal", module).add("Tooltip", TooltipStory));
