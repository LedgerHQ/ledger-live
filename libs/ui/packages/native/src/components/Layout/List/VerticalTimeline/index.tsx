import React from "react";

import TimelineItem from "./TimelineItem";
import Flex from "../../Flex";
import Text, { BaseTextProps } from "../../../Text";
import { BaseStyledProps } from "src/components/styled";
import { Item, ItemStatus } from "../types";

export type Props = BaseStyledProps & {
  steps?: Item[];
  formatEstimatedTime?: (_: number) => string;
  setActiveIndex?: (arg0: number) => void;
};

export default function VerticalTimeline({
  steps,
  formatEstimatedTime,
  setActiveIndex,
  ...props
}: Props) {
  return (
    <Flex {...props} flexDirection="column">
      {steps?.map((step, index) => (
        <TimelineItem
          key={step.title}
          item={step}
          formatEstimatedTime={formatEstimatedTime}
          isFirstItem={index === 0}
          isLastItem={index === steps.length - 1}
          setActiveIndex={setActiveIndex}
          index={index}
        />
      ))}
    </Flex>
  );
}

const SubtitleText: React.FC<BaseTextProps> = (props) => (
  <Text variant="body" fontWeight="semiBold" color="primary.c80" mb={3} {...props} />
);

const BodyText: React.FC<BaseTextProps> = (props) => (
  <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c80" {...props} />
);

VerticalTimeline.BodyText = BodyText;
VerticalTimeline.SubtitleText = SubtitleText;
VerticalTimeline.ItemStatus = ItemStatus;
