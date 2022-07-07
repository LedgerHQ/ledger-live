import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Image } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled from "styled-components/native";

export type Props = {
  id?: string;
  title: string;
  index: number;
  seen: boolean;
  iconUrl?: string;
  onPress: () => void;
};

const Container = styled(Flex).attrs({
  flex: 1,
  flexDirection: "column",
  alignItems: "center",
})``;

const Title = styled(Text).attrs({
  variant: "body",
  mt: "6px",
})`
  font-weight: 400;
`;

const Touchable = styled(TouchableOpacity)`
  border-color: ${p =>
    p.seen ? p.theme.colors.neutral.c50 : p.theme.colors.warning.c100};
  border-width: 1px;
  padding: 3px;
  border-radius: 100px;
`;

const Illustration = styled(Image).attrs({ resizeMode: "cover" })`
  height: 72px;
  width: 72px;
  border-radius: 72px;
`;

const StoryGroup: React.FC<Props> = props => {
  const { onPress, seen, title, iconUrl } = props;
  return (
    <Container>
      <Touchable seen={seen} onPress={onPress || undefined}>
        <Flex
          height="72px"
          width="72px"
          borderRadius="72px"
          backgroundColor="neutral.c30"
        >
          <Illustration source={{ uri: iconUrl }} />
        </Flex>
      </Touchable>
      <Title>{title}</Title>
    </Container>
  );
};

export default StoryGroup;
