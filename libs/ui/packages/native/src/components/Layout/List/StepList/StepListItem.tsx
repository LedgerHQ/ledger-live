import React, { ReactNode } from "react";
import styled from "styled-components/native";

import { Flex } from "../..";
import { Text } from "../../../";

const Container = styled(Flex)<{ status?: string }>`
  flex: 1;
  border-radius: ${(p) => p.theme.radii[2]}px;
  background: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c10 : p.theme.colors.neutral.c20};
  border: 1px solid ${(p) => (p.status === "active" ? p.theme.colors.primary.c80 : "transparent")};
  padding: 20px 16px;
  margin-bottom: 16px; // TODO: remove
`;

export type Props = {
  status?: "inactive" | "active" | "completed";
  title?: string;
  children?: ReactNode;
};

export default function StepListItem({ status, title, children }: Props) {
  return (
    <Container status={status}>
      <Text variant="body" color={status === "inactive" ? "neutral.c70" : "primary.c90"}>
        {title}
      </Text>
      {status === "active" && children}
    </Container>
  );
}
