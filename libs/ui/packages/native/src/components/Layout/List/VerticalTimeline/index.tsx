import React, { ReactNode } from "react";

import TimelineItem from "./TimelineItem";
import { Flex } from "../..";

export type ItemStatus = "inactive" | "active" | "completed";

export type Item = {
  status: ItemStatus;
  title: string;
  renderBody?: () => ReactNode;
};

export type Props = {
  steps?: Item[];
};

export default function VerticalTimeline({ steps }: Props) {
  return (
    <Flex flexDirection="column">
      {steps?.map((step, index) => (
        <TimelineItem
          key={step.title}
          item={step}
          isFirstItem={index === 0}
          isLastItem={index === steps.length - 1}
        />
      ))}
    </Flex>
  );
}
