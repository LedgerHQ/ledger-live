import React from "react";

import { Item } from ".";
import { Flex } from "../..";
import StepIndicator from "./StepIndicator";
import StepListItem from "./StepListItem";

export type Props = {
  item: Item;
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

export default function StepListItemWrapper({ item, isFirstItem, isLastItem }: Props) {
  return (
    <Flex flexDirection="row">
      <StepIndicator
        status={item.status}
        hideTopSegment={isFirstItem}
        hideBottomSegment={isLastItem}
        mr={4}
      />
      <StepListItem status={item.status} title={item.title} mb={6}>
        {item.renderBody && item.renderBody()}
      </StepListItem>
    </Flex>
  );
}
