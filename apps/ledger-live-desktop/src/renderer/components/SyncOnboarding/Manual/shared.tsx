import React from "react";
import { Flex, Text, InfiniteLoader, VerticalTimeline, Icons } from "@ledgerhq/react-ui";
import styled, { StyledComponent, DefaultTheme, useTheme } from "styled-components";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex";

export const analyticsFlowName = "Onboarding";

export const StepText = styled(VerticalTimeline.BodyText)`
  white-space: pre-wrap;
`;

export const BorderFlex: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(Flex)`
  background-color: ${p => p.theme.colors.palette.neutral.c30};
  border-radius: 35px;
`;

export const IconContainer: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(
  BorderFlex,
).attrs({
  width: 40,
  height: 40,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
})`
  color: ${p => p.theme.colors.palette.neutral.c100};
`;

export const Row: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
})``;

export const Column: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(Flex).attrs({
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
          <InfiniteLoader color="primary.c60" size={24} />
        ) : status === Status.completed ? (
          <Icons.CheckTickMedium size={20} color="success.c50" />
        ) : status === Status.updateAvailable ? (
          <InfoCircle size={20} color={colors.primary.c80} />
        ) : status === Status.failed ? (
          <Icons.CircledCrossSolidMedium size={20} color="error.c50" />
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
