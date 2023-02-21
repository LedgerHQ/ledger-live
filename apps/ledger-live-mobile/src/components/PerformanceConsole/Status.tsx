import React from "react";
import { Text, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import usePerformanceReportsLog, {
  getNavigationVitalsStatusStyle,
} from "./usePerformanceReportsLog";

const Status = () => {
  const { colors } = useTheme();
  const { lastCompleteRenderPassReport, timeToBootJs } =
    usePerformanceReportsLog();

  const navigationVitalsStatusStyle = getNavigationVitalsStatusStyle(
    lastCompleteRenderPassReport,
    colors,
  );
  return (
    <>
      <Flex alignItems={"center"} py={3}>
        <Text variant={"h5"} fontWeight={"semiBold"} mb={5}>
          Last screen rendered :
        </Text>
        <Text
          variant={"large"}
          fontWeight={"semiBold"}
          color={navigationVitalsStatusStyle.textColor}
        >
          {lastCompleteRenderPassReport?.destinationScreen}
        </Text>
        <Text
          variant={"h5"}
          fontWeight={"bold"}
          color={navigationVitalsStatusStyle.textColor}
          backgroundColor={navigationVitalsStatusStyle.bgColor}
          borderRadius={2}
          px={4}
        >
          {lastCompleteRenderPassReport?.timeToRenderMillis} ms
        </Text>
        <Text
          variant={"large"}
          fontWeight={"semiBold"}
          color={navigationVitalsStatusStyle.textColor}
          alignContent={"center"}
        >
          {navigationVitalsStatusStyle.statusText}
        </Text>
      </Flex>

      <Flex>
        <Text variant={"small"}>
          RN-performance timeToBootJs :{" "}
          <Text fontWeight={"semiBold"}>{timeToBootJs} ms</Text>
        </Text>
      </Flex>
    </>
  );
};

export default React.memo(Status);
