import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import useAnalyticsEventsLog from "./useAnalyticsEventsLog";
import Event from "./Event";

type ListProps = {
  showExtraProps: boolean;
  hideSyncEvents: boolean;
};

const EventList: React.FC<ListProps> = ({ showExtraProps, hideSyncEvents }) => {
  const { items } = useAnalyticsEventsLog();
  return (
    <Flex flexDirection="column-reverse" width="300px" flex={1}>
      {items
        .filter(event => !(hideSyncEvents && event.eventName.startsWith("Sync")))
        .map((item, _, filteredItems) => {
          const isLast =
            Math.abs(item.date.getTime() - filteredItems[filteredItems.length - 1].date.getTime()) <
            1000;
          return (
            <Flex flexShrink={1} key={item.id}>
              <Event {...item} showExtraProps={showExtraProps} isLast={isLast} />
            </Flex>
          );
        })}
    </Flex>
  );
};

export default EventList;
