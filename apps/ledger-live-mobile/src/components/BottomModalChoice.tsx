import React, { memo } from "react";
import styled from "styled-components/native";
import { Text, Icon, Flex } from "@ledgerhq/native-ui";
import Touchable from "./Touchable";

const hitSlop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const Container = styled(Touchable)<{ opacity: number }>`
  flex-direction: row;
  padding-vertical: 15px;
  margin-vertical: 5px;
  align-items: center;
  opacity: ${p => p.opacity};
`;

type Props = {
  onPress?: React.ComponentProps<typeof Touchable>["onPress"];
  iconName: string;
  title: string;
  description?: string;
  event?: string;
  eventProperties?: React.ComponentProps<typeof Touchable>["eventProperties"];
};

function BottomModalChoice({
  iconName,
  title,
  description,
  onPress,
  event,
  eventProperties,
}: Props) {
  return (
    <Container
      onPress={onPress}
      opacity={onPress ? 1 : 0.5}
      hitSlop={hitSlop}
      event={event}
      eventProperties={eventProperties}
    >
      <Flex pr={6} alignItems="center" justifyContent="center">
        {iconName ? <Icon name={iconName} size={24} color="primary.c100" /> : null}
      </Flex>
      <Flex flex={1}>
        <Text variant="h3" fontWeight="semiBold" color="neutral.c100">
          {title}
        </Text>
        {!!description && (
          <Text variant="body" color="neutral.c70">
            {description}
          </Text>
        )}
      </Flex>
    </Container>
  );
}

export default memo<Props>(BottomModalChoice);
