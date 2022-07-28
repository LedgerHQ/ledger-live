import { storiesOf } from "../../storiesOf";
import React from "react";
import { Box } from "../../../../lib";
import QuickActionList from "../../../../src/components/cta/QuickAction/QuickActionList";
import { QuickActionButtonProps } from "../../../../src/components/cta/QuickAction/QuickActionButton";
import {
  PlusMedium,
  LendMedium,
  ArrowBottomMedium,
  MinusMedium,
  ArrowTopMedium,
  DelegateMedium,
} from "@ledgerhq/icons-ui/native";
import { action } from "@storybook/addon-actions";

const List = (): JSX.Element => {
  const data: QuickActionButtonProps[] = [
    {
      Icon: PlusMedium,
      children: "Buy",
      onPress: action("onPress"),
    },
    {
      Icon: ArrowBottomMedium,
      children: "Receive",
      onPress: action("onPress"),
    },
    {
      Icon: LendMedium,
      children: "Earn",
      onPress: action("onPress"),
    },
    {
      Icon: MinusMedium,
      children: "Sell",
      onPress: action("onPress"),
    },
    {
      Icon: ArrowTopMedium,
      children: "Send",
      disabled: true,
      onPress: action("onPress"),
    },
    {
      Icon: DelegateMedium,
      children: "Convert",
      disabled: true,
      onPress: action("onPress"),
    },
  ];

  return (
    <Box width={"100%"} px={7}>
      <QuickActionList data={data} />
    </Box>
  );
};

storiesOf((story) => story("CTA/QuickAction", module).add("List", List));
