import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text, Tag, Flex } from "@ledgerhq/native-ui";
import { LoggableEventRenderable } from "./types";

type Props = LoggableEventRenderable & {
  showExtraProps?: boolean;
  isLast?: boolean;
};

const Event: React.FC<Props> = ({
  eventName,
  eventProperties,
  eventPropertiesWithoutExtra,
  date,
  showExtraProps = false,
  isLast,
}) => {
  const propertiesToDisplay = showExtraProps
    ? eventProperties
    : eventPropertiesWithoutExtra;
  const propertiesText = useMemo(
    () =>
      propertiesToDisplay
        ? JSON.stringify(
            propertiesToDisplay,
            Object.keys(propertiesToDisplay).sort(),
            2,
          )
            .split("\n")
            .slice(1, -1)
            .join("\n")
        : null,
    [propertiesToDisplay],
  );

  return (
    <Flex
      py={3}
      mx={1}
      px={1}
      borderLeftWidth={2}
      borderLeftColor={isLast ? "black" : "transparent"}
    >
      <Flex flexDirection="row">
        <Text color="black" fontWeight="bold">
          {eventName}
        </Text>
        <Text color="grey"> {date?.toLocaleTimeString()}</Text>
      </Flex>
      <Text color="black">{propertiesText}</Text>
    </Flex>
  );
};

export default React.memo(Event);
