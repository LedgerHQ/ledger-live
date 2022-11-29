import React from "react";
import { Flex, Text, InfiniteLoader, FlexBoxProps, Icons } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";

import InfoCircle from "~/renderer/icons/InfoCircle";

export const StepText = styled(Text).attrs({
  color: "neutral.c90",
  variant: "body",
  fontWeight: "medium",
})``;

export const BorderFlex = styled(Flex)`
  background-color: ${p => p.theme.colors.palette.neutral.c30};
  border-radius: 35px;
`;

export const IconContainer = styled(BorderFlex).attrs({
  width: 40,
  height: 40,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
})`
  color: ${p => p.theme.colors.palette.neutral.c100};
`;

export const Row = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
})``;

export const Column = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
})``;

export enum Status {
  inactive = "inactive",
  requested = "requested",
  updateAvailable = "updateAvailable",
  cancelled = "cancelled",
  active = "active",
  notGenuine = "notGenuine",
  completed = "completed",
  failed = "failed",
}

export type StatusType =
  | "inactive"
  | "requested"
  | "updateAvailable"
  | "cancelled"
  | "active"
  | "notGenuine"
  | "completed"
  | "failed";

export type BulletProps = FlexBoxProps & {
  status: StatusType;
  bulletText?: string | number;
  text: string;
  subText?: string;
};

export const Bullet = ({ status, bulletText, text, subText, ...props }: BulletProps) => {
  const { colors } = useTheme();

  return (
    <Row {...props}>
      <IconContainer>
        {status === Status.active ? (
          <InfiniteLoader color="primary.c80" size={24} />
        ) : status === Status.completed ? (
          <Icons.CircledCheckSolidMedium size={24} color="success.c60" />
        ) : status === Status.updateAvailable ? (
          <InfoCircle size={24} color={colors.constant.purple} />
        ) : status === Status.failed ? (
          <Icons.CircledCrossSolidMedium size={24} color="error.c80" />
        ) : (
          <Text variant="body">{bulletText}</Text>
        )}
      </IconContainer>
      <Column flex="1" ml={4}>
        <StepText>{text}</StepText>
        {subText && <StepText variant="small">{subText}</StepText>}
      </Column>
    </Row>
  );
};
