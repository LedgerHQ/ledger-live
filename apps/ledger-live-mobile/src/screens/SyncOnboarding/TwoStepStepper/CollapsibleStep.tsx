import React, { PropsWithChildren } from "react";
import CircledCheckSolidMedium from "@ledgerhq/icons-ui/nativeLegacy/CircledCheckSolidMedium";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";

export type CollapsibleStepStatus = "complete" | "unfinished";

interface CollapsibleStepProps extends PropsWithChildren {
  status: CollapsibleStepStatus;
  title?: string;
  isCollapsed: boolean;
}

const CenterCircle = styled(Flex)<{ status: CollapsibleStepStatus }>`
  border-radius: 9999px;
  width: 16px;
  height: 16px;
  background: ${p =>
    p.status === "complete" ? p.theme.colors.success.c70 : p.theme.colors.primary.c40};
  ${p => p.status === "unfinished" && `border: 2px solid ${p.theme.colors.primary.c80};`}
  align-items: center;
  justify-content: center;
`;

const StatusIcon = ({ status }: { status: CollapsibleStepStatus }) => {
  const { colors } = useTheme();
  return (
    <CenterCircle status={status}>
      {status === "complete" && <CircledCheckSolidMedium color={colors.success.c70} size={20} />}
    </CenterCircle>
  );
};

const CollapsibleStep = ({ status, title, isCollapsed, children }: CollapsibleStepProps) => {
  if (isCollapsed) {
    return (
      <Flex justifyContent="space-between" flexDirection="row">
        <Text>{title}</Text>
        <StatusIcon status={status} />
      </Flex>
    );
  }

  return (
    <Flex>
      <Flex justifyContent="space-between" flexDirection="row">
        <Text>{title}</Text>
        <StatusIcon status={status} />
      </Flex>
      {children}
    </Flex>
  );
};

export default CollapsibleStep;
