import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import React from "react";
import styled from "styled-components/native";
import Touchable from "../Touchable";

type Props = {
  onPress: (e?: any) => any;
  iconName: string;
  title: string;
  event: string;
  eventProperties?: Object;
};

const StyledTouchable = styled(Touchable)`
  margin-top: 16px;
`;

const Container = styled(Flex).attrs({
  backgroundColor: "neutral.c30",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  px: 8,
  py: 10,
  borderRadius: 8,
})``;

const ModalChoice: React.FC<Props> = props => {
  const { iconName, title, onPress, event, eventProperties } = props;
  return (
    <StyledTouchable
      onPress={onPress}
      event={event}
      eventProperties={eventProperties}
    >
      <Container>
        <Text flex={1} variant="large" fontWeight="semiBold">
          {title}
        </Text>
        <Flex
          height={48}
          width={48}
          borderRadius={24}
          backgroundColor="primary.c20"
          alignItems="center"
          justifyContent="center"
        >
          {iconName ? (
            <Icon name={iconName} size={24} color="primary.c80" />
          ) : null}
        </Flex>
      </Container>
    </StyledTouchable>
  );
};

export default ModalChoice;
