import React, { ReactNode } from "react";
import styled from "styled-components/native";

import { ItemStatus } from ".";
import Flex, { Props as FlexProps } from "../../Flex";
import { Text } from "../../..";

const Container = styled(Flex)<{ status: ItemStatus }>`
  flex: 1;
  border-radius: ${(p) => p.theme.radii[2]}px;
  background: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c10 : p.theme.colors.neutral.c20};
  border: 1px solid ${(p) => (p.status === "active" ? p.theme.colors.primary.c80 : "transparent")};
  padding: 20px 16px;
`;

export type Props = FlexProps & {
  status: ItemStatus;
  title: string;
  children?: ReactNode;
};

export default function StepListItem({ status, title, children, ...props }: Props) {
  return (
    <Container status={status} {...props}>
      <Text variant="body" color={status === "inactive" ? "neutral.c70" : "primary.c90"}>
        {title}
      </Text>
      <Flex mt={12}>{children}</Flex>
    </Container>
  );
}
