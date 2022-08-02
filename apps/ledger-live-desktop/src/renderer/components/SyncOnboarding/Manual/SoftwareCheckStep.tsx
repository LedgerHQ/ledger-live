import React from "react";
import { Flex, Text, InfiniteLoader } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";

import Check from "~/renderer/icons/Check";

export const BorderFlex = styled(Flex)`
  background-color: ${p => p.theme.colors.palette.neutral.c30};
  border-radius: 35px;
`;

export const IconContainer = styled(BorderFlex).attrs({
  width: 60,
  height: 60,
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

const Bullet = ({
  isActive,
  isCompleted,
  bulletText,
  text,
  subText,
}: {
  isActive: boolean;
  isCompleted: boolean;
  bulletText?: string | number;
  text: string;
  subText?: string;
}) => {
  const theme = useTheme();
  return (
    <Row mb={8}>
      <IconContainer>
        {isActive ? (
          <InfiniteLoader />
        ) : isCompleted ? (
          <Check size={24} color={theme.colors.palette.success.c50} />
        ) : (
          bulletText
        )}
      </IconContainer>
      <Column flex="1" ml={4}>
        <Text variant="body">{text}</Text>
        {subText && (
          <Text mt={2} variant="small" color="palette.neutral.c80">
            {subText}
          </Text>
        )}
      </Column>
    </Row>
  );
};

enum Status {
  inactive = "inactive",
  active = "active",
  completed = "completed",
}

type StatusType = "inactive" | "active" | "completed";

export const SoftwareCheckContent = ({
  genuineCheckStatus,
  firmwareUpdateStatus,
}: {
  genuineCheckStatus: StatusType;
  firmwareUpdateStatus: StatusType;
}) => {
  return (
    <>
      <Bullet
        bulletText="1"
        isActive={genuineCheckStatus === Status.active && true}
        isCompleted={genuineCheckStatus === Status.completed && true}
        text={genuineCheckStatus === Status.completed ? "Nano is authentic" : "Checking Nano"}
      />
      <Bullet
        bulletText="2"
        isActive={firmwareUpdateStatus === Status.active && true}
        isCompleted={firmwareUpdateStatus === Status.completed && true}
        text={
          genuineCheckStatus === Status.inactive
            ? "Software check"
            : genuineCheckStatus === Status.active
            ? "Checking for software updates"
            : "Software is up to date"
        }
      />
    </>
  );
};
