import React, { useCallback, useMemo, useState } from "react";
import { Pressable } from "react-native";
import { Text, Flex } from "@ledgerhq/native-ui";
import { RenderPassReport } from "@shopify/react-native-performance";

type Props = {
  report: RenderPassReport;
  date: Date;
  showExtraProps?: boolean;
  isLast?: boolean;
};

const Event: React.FC<Props> = ({
  report,
  date,
  showExtraProps = false,
  isLast,
}) => {
  const [forceShowExtra, setForceShowExtra] = useState(false);
  const propertiesToDisplay = showExtraProps
    ? report
    : // Filter less usefull properties
      (({
        flowStartTimeSinceEpochMillis,
        flowInstanceId,
        resourceAcquisitionStatus,
        timeToConsumeTouchEventMillis,
        reportId,
        ...rest
      }) => rest)(report);
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
        <Flex flexDirection="row" flexWrap="wrap">
          <Text color="black" fontWeight="bold">
            {report.destinationScreen}
          </Text>
          <Text color="grey"> {date?.toLocaleTimeString()}</Text>
        </Flex>
        <Text color="black">{propertiesText}</Text>
      </Flex>
    </Pressable>
  );
};

export default React.memo(Event);
