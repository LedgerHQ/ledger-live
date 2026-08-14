import React, { useCallback, useMemo, useState } from "react";
import { Pressable } from "react-native";
import { Text, Flex } from "@ledgerhq/native-ui";
import type { AnalyticsDeliveryStatus } from "../../analytics";
import { LoggableEventRenderable } from "./types";

type Props = LoggableEventRenderable & {
  showExtraProps?: boolean;
  isLast?: boolean;
};

const deliveryStatusColor: Record<AnalyticsDeliveryStatus, string> = {
  enqueued: "black",
  flushed: "purple",
  skipped_no_token: "red",
  skipped_no_client: "red",
  skipped_no_store: "red",
  failed: "red",
};

const Event: React.FC<Props> = ({
  eventName,
  eventProperties,
  eventPropertiesWithoutExtra,
  date,
  deliveryStatus,
  showExtraProps = false,
  isLast,
}) => {
  const [forceShowExtra, setForceShowExtra] = useState(false);
  const propertiesToDisplay =
    showExtraProps || forceShowExtra ? eventProperties : eventPropertiesWithoutExtra;
  const propertiesText = useMemo(
    () =>
      propertiesToDisplay
        ? JSON.stringify(propertiesToDisplay, null, 2).replace(/^{\n|\n}$/g, "")
        : null,
    [propertiesToDisplay],
  );

  const toggleForceShowExtra = useCallback(() => {
    setForceShowExtra(!forceShowExtra);
  }, [forceShowExtra]);

  return (
    <Pressable onPress={toggleForceShowExtra}>
      <Flex
        py={3}
        mx={1}
        px={1}
        borderLeftWidth={2}
        borderLeftColor={isLast ? "black" : "transparent"}
      >
        <Flex flexDirection="row" flexWrap="wrap" alignItems="center">
          <Text
            color={deliveryStatus ? deliveryStatusColor[deliveryStatus] : "black"}
            fontWeight="bold"
          >
            {eventName}
          </Text>
          {deliveryStatus && deliveryStatus !== "enqueued" ? (
            <Text color="grey"> {deliveryStatus}</Text>
          ) : null}
          <Text color="grey"> {date?.toLocaleTimeString()}</Text>
        </Flex>
        <Text color="black">{propertiesText}</Text>
      </Flex>
    </Pressable>
  );
};

export default React.memo(Event);
