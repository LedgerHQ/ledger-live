import React from "react";
import { ScrollView } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import Animated, { Layout, SlideInLeft } from "react-native-reanimated";
import useAnalyticsEventsLog from "./useAnalyticsEventsLog";
import Event from "./Event";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

type ListProps = {
  showExtraProps: boolean;
  hideSyncEvents: boolean;
};

const EventList: React.FC<ListProps> = ({ showExtraProps, hideSyncEvents }) => {
  const { items } = useAnalyticsEventsLog();
  return (
    <ScrollView>
      <AnimatedFlex paddingBottom={100} flexDirection="column-reverse">
        {items
          .filter(
            event => !(hideSyncEvents && event.eventName.startsWith("Sync")),
          )
          .map((item, _, filteredItems) => {
            const isLast =
              Math.abs(
                item.date.getTime() -
                  filteredItems[filteredItems.length - 1].date.getTime(),
              ) < 1000;
            return (
              <AnimatedFlex
                key={item.id}
                layout={Layout}
                entering={SlideInLeft}
              >
                <Event
                  {...item}
                  showExtraProps={showExtraProps}
                  isLast={isLast}
                />
              </AnimatedFlex>
            );
          })}
      </AnimatedFlex>
    </ScrollView>
  );
};

export default EventList;
