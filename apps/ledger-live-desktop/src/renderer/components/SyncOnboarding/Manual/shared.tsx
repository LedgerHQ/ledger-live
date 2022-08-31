import React from "react";
import { Flex, Text, InfiniteLoader } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";

import Check from "~/renderer/icons/Check";
import InfoCircle from "~/renderer/icons/InfoCircle";

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

export enum Status {
  inactive = "inactive",
  requested = "requested",
  updateAvailable = "updateAvailable",
  cancelled = "cancelled",
  active = "active",
  completed = "completed",
  failed = "failed",
}

export type StatusType =
  | "inactive"
  | "requested"
  | "updateAvailable"
  | "cancelled"
  | "active"
  | "completed"
  | "failed";

export const Bullet = ({
  status,
  bulletText,
  text,
  subText,
}: {
  status: StatusType;
  bulletText?: string | number;
  text: string;
  subText?: string;
}) => {
  const theme = useTheme();

  return (
    <Row mb={8}>
      <IconContainer>
        {status === Status.active ? (
          <InfiniteLoader />
        ) : status === Status.completed ? (
          <Check size={24} color={theme.colors.palette.success.c50} />
        ) : status === Status.updateAvailable ? (
          <InfoCircle size={24} color={theme.colors.palette.constant.purple} />
        ) : (
          <Text fontSize="20px">{bulletText}</Text>
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
