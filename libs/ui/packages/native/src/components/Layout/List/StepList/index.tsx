import React, { ReactNode } from "react";

import StepListItem from "./StepListItem";
import { Flex } from "../..";
import StepIndicator from "./StepIndicator";

export type Item = {
  status: "inactive" | "active" | "completed";
  title: string;
  renderBody?: () => ReactNode;
};

export type Props = {
  items?: Item[];
};

export default function StepList({ items }: Props) {
  return (
    <Flex flexDirection="column">
      {items?.map((item, index) => (
        <Flex flexDirection="row">
          <StepIndicator
            status={item.status}
            hideTopSegment={index === 0}
            hideBottomSegment={index === items.length - 1}
          />
          <Flex width={12} />
          <StepListItem status={item.status} title={item.title}>
            {item.renderBody && item.renderBody()}
          </StepListItem>
        </Flex>
      ))}
    </Flex>
  );
}
