import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import Touchable from "~/components/Touchable";
import styled from "styled-components/native";

type ActionRowProps = {
  title: string;
  description?: string;
  icon: React.ReactNode;
  testID?: string;
  onPress?: () => void;
};
const TouchableCard = styled(Touchable)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 8px;
  padding: 16px;
  align-items: center;
  gap: 12px;
  flex-direction: row;
  align-self: stretch;
`;

const CardTitle = styled(Text)`
  font-size: 16px;
  color: ${p => p.theme.colors.neutral.c100};
`;

const CardDescription = styled(Text)`
  font-size: 14px;
  color: ${p => p.theme.colors.neutral.c70};
  line-height: 18.2px;
`;

const ActionRow: React.FC<ActionRowProps> = ({
  title,
  description,
  icon,
  testID,
  onPress,
}: ActionRowProps) => {
  return (
    <TouchableCard onPress={onPress} testID={testID}>
      {icon}
      <Flex flexDirection={"column"} rowGap={4} flex={1}>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </Flex>
    </TouchableCard>
  );
};
export default ActionRow;
