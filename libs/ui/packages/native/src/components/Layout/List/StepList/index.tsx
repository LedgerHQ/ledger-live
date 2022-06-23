import React, { ReactNode } from "react";

import StepListItem from "./StepListItem";
import { Flex } from "../..";

export type ItemStatus = "inactive" | "active" | "completed";

export type Item = {
  status: ItemStatus;
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
        <StepListItem
          key={item.title}
          item={item}
          isFirstItem={index === 0}
          isLastItem={index === items.length - 1}
        />
      ))}
    </Flex>
  );
}
