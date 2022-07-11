import React, { ReactNode } from "react";

import TimelineItem from "./TimelineItem";
import { Flex } from "../..";
import { BaseStyledProps } from "src/components/styled";

export type ItemStatus = "inactive" | "active" | "completed";

export type Item = {
  status: ItemStatus;
  title: string;
  renderBody?: (isDisplayed?: boolean) => ReactNode;
};

export type Props = BaseStyledProps & {
  steps?: Item[];
};

export default function VerticalTimeline({ steps, ...props }: Props) {
  return (
    <Flex {...props} flexDirection="column">
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
