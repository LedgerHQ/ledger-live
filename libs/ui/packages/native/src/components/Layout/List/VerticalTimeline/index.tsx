import React, { useRef, useCallback } from "react";
import { LayoutChangeEvent, ScrollView, LayoutRectangle, View } from "react-native";

import TimelineItem from "./TimelineItem";
import Flex from "../../Flex";
import Text, { BaseTextProps } from "../../../Text";
import { BaseStyledProps } from "src/components/styled";
import { Item, ItemStatus } from "../types";

export type Props = BaseStyledProps & {
  steps?: Item[];
  formatEstimatedTime?: (_: number) => string;
  setActiveIndex?: (arg0: number) => void;
  header?: React.ReactNode;
  /**
   * Should the scroll view automatically scroll to the active step.
   * Defaults to true.
   * */
  autoScroll?: boolean;
};

export default function VerticalTimeline({
  steps,
  formatEstimatedTime,
  setActiveIndex,
  header,
  autoScroll = true,
  ...props
}: Props) {
  const scrollViewRef = useRef<ScrollView | null>(null);

  const stepsContainerLayout = useRef<LayoutRectangle>();
  const onStepsContainerLayout = useCallback((evt: LayoutChangeEvent) => {
    stepsContainerLayout.current = evt.nativeEvent.layout;
  }, []);

  const onActiveStepLayout = useCallback((evt: LayoutChangeEvent) => {
    if (!stepsContainerLayout.current || !scrollViewRef.current) return;
    const { layout } = evt.nativeEvent;
    scrollViewRef.current.scrollTo({ x: 0, y: stepsContainerLayout.current.y + layout.y });
  }, []);

  return (
    <ScrollView ref={scrollViewRef} onLayout={onStepsContainerLayout}>
      {header}
      <Flex {...props} onLayout={onStepsContainerLayout} flexDirection="column">
        {steps?.map((step, index) => (
          <View onLayout={autoScroll && step.status === "active" ? onActiveStepLayout : undefined}>
            <TimelineItem
              key={step.title}
              item={step}
              formatEstimatedTime={formatEstimatedTime}
              isFirstItem={index === 0}
              isLastItem={index === steps.length - 1}
              setActiveIndex={setActiveIndex}
              index={index}
            />
          </View>
        ))}
      </Flex>
    </ScrollView>
  );
}

const SubtitleText: React.FC<BaseTextProps> = (props) => (
  <Text variant="body" fontWeight="semiBold" color="neutral.c100" mb={3} {...props} />
);

const BodyText: React.FC<BaseTextProps> = (props) => (
  <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c80" {...props} />
);

VerticalTimeline.BodyText = BodyText;
VerticalTimeline.SubtitleText = SubtitleText;
VerticalTimeline.ItemStatus = ItemStatus;
