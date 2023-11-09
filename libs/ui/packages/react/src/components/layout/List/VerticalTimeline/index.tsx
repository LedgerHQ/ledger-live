import React, { ReactNode } from "react";

import TimelineItem from "./TimelineItem";
import { Flex } from "../..";
import Text, { TextProps } from "../../../asorted/Text";
import { BaseStyledProps } from "../../../styled";

export type ItemStatus = "inactive" | "active" | "completed";

export type Item = {
  status: ItemStatus;
  title: string;
  renderBody?: (isDisplayed?: boolean) => ReactNode;
  estimatedTime?: number;
};

export type Props = BaseStyledProps & {
  steps?: Item[];
  onClickIndex?: (index: number) => void;
};

export default function VerticalTimeline({ steps, onClickIndex, ...props }: Props) {
  return (
    <Flex {...props} flexDirection="column" flex={1}>
      {steps?.map((step, index) => (
        <TimelineItem
          key={index}
          item={step}
          isFirstItem={index === 0}
          isLastItem={index === steps.length - 1}
          onClick={onClickIndex ? () => onClickIndex(index) : undefined}
        />
      ))}
    </Flex>
  );
}

const SubtitleText: React.FC<TextProps> = props => (
  <Text variant="body" fontWeight="semiBold" color="neutral.c100" mb={3} {...props} />
);

const BodyText: React.FC<TextProps> = props => (
  <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c80" {...props} />
);

VerticalTimeline.BodyText = BodyText;
VerticalTimeline.SubtitleText = SubtitleText;
