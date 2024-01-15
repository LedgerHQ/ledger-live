import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { getIsTracking } from "~/analytics";
import { State } from "~/reducers/types";

const trackingSelector = (state: State) => getIsTracking(state, false);

const Status = () => {
  const isTracking = useSelector(trackingSelector);
  return (
    <Flex>
      <Text color="black">
        Tracking status: {isTracking.enabled ? "enabled" : "disabled"}
        {!isTracking.enabled ? ": " + isTracking.reason : ""}
      </Text>
    </Flex>
  );
};

export default Status;
