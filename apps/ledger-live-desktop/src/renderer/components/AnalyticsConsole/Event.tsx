import React, { useCallback, useMemo, useState } from "react";
import { Text, Flex } from "@ledgerhq/react-ui";
import { LoggableEventRenderable } from "./types";
import styled, { keyframes } from "styled-components";

type Props = LoggableEventRenderable & {
  showExtraProps?: boolean;
  isLast?: boolean;
};

const animateHeight = keyframes`
  from {
    max-height: 0px;
    opacity: 0;
  }

  to {
    max-height: 1000px;
    opacity: 1;
  }
`;

const Row = styled(Flex)`
  animation-name: ${animateHeight};
  animation-duration: 1s;
  animation-iteration-count: 1;
  cursor: pointer;
`;

const Event: React.FC<Props> = ({
  eventName,
  eventProperties,
  eventPropertiesWithoutExtra,
  date,
  showExtraProps = false,
  isLast,
}) => {
  const [forceShowExtra, setForceShowExtra] = useState(false);
  const propertiesToDisplay =
    showExtraProps || forceShowExtra ? eventProperties : eventPropertiesWithoutExtra;
  const propertiesText = useMemo(
    () =>
      propertiesToDisplay
        ? JSON.stringify(propertiesToDisplay, Object.keys(propertiesToDisplay).sort(), 2)
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
    <Row
      onClick={toggleForceShowExtra}
      flexDirection="column"
      alignItems="flex-start"
      py={3}
      mx={1}
      px={1}
      borderLeft="solid"
      borderLeftWidth={4}
      borderLeftColor={isLast ? "black" : "transparent"}
      flexShrink={1}
    >
      <Flex flexDirection="row" flexWrap="wrap" columnGap={3}>
        <Text fontSize={"10px"} color="black" fontWeight="bold">
          {eventName}
        </Text>
        <Text fontSize={"10px"} color="black">
          {date?.toLocaleTimeString()}
        </Text>
      </Flex>
      <Text fontSize={"10px"} whiteSpace="pre-wrap" color="black">
        {propertiesText}
      </Text>
    </Row>
  );
};

export default React.memo(Event);
