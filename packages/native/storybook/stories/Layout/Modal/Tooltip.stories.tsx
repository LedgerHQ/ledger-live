import React from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, text } from "@storybook/addon-knobs";
import Tooltip from "@components/Layout/Modal/Tooltip";
import Text from "@components/Text";
import CenterView from "../../CenterView";
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

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Modal/Tooltip", () => <TooltipStory />);
