import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import Touchable from "~/components/Touchable";
import styled from "styled-components/native";

const Card = styled(Flex)`
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

type AddAccountDrawerRowProps = {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
};

const ActionRow = ({ title, description, icon, onPress }: AddAccountDrawerRowProps) => {
  return (
    <Touchable onPress={onPress}>
      <Card>
        {icon}
        <Flex flexDirection={"column"} rowGap={4} flex={1}>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </Flex>
      </Card>
    </Touchable>
  );
};
export default ActionRow;
