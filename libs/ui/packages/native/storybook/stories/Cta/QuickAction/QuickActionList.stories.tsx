import {
  ArrowBottomMedium,
  ArrowTopMedium,
  DelegateMedium,
  LendMedium,
  MinusMedium,
  PlusMedium,
} from "@ledgerhq/icons-ui/nativeLegacy";
import { action } from "@storybook/addon-actions";
import React from "react";
import Box from "../../../../src/components/Layout/Box";
import { QuickActionButtonProps } from "../../../../src/components/cta/QuickAction/QuickActionButton";
import QuickActionList from "../../../../src/components/cta/QuickAction/QuickActionList";

export default {
  title: "CTA/QuickAction/List",
  component: QuickActionList,
};

const DATA: QuickActionButtonProps[] = [
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

export const List = (): JSX.Element => {
  return (
    <Box width={"100%"} px={7}>
      <QuickActionList data={DATA} id="test" />
    </Box>
  );
};

List.storyName = "QuickActionList";

export const ListSmall = (): JSX.Element => {
  return (
    <Box width={"100%"} px={7}>
      <QuickActionList
        data={DATA.map((element) => ({ ...element, variant: "small", textVariant: "small" }))}
        id="test"
        numColumns={6}
      />
    </Box>
  );
};

ListSmall.storyName = "QuickActionListSmall";
