import {
  ArrowBottomMedium,
  ArrowTopMedium,
  DelegateMedium,
  LendMedium,
  MinusMedium,
  PlusMedium,
} from "@ledgerhq/icons-ui/nativeLegacy";
import React, { type JSX } from "react";
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
    onPress: () => {},
  },
  {
    Icon: ArrowBottomMedium,
    children: "Receive",
    onPress: () => {},
  },
  {
    Icon: LendMedium,
    children: "Earn",
    onPress: () => {},
  },
  {
    Icon: MinusMedium,
    children: "Sell",
    onPress: () => {},
  },
  {
    Icon: ArrowTopMedium,
    children: "Send",
    disabled: true,
    onPress: () => {},
  },
  {
    Icon: DelegateMedium,
    children: "Convert",
    disabled: true,
    onPress: () => {},
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
