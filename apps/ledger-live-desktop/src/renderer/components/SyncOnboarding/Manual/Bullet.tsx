import React from "react";
import { Flex, Text, InfiniteLoader, Icons } from "@ledgerhq/react-ui";
import styled, { StyledComponent, DefaultTheme } from "styled-components";
import { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex";
import { Status } from "./types";

const BorderFlex: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(Flex).attrs({
  border: "1px solid",
  borderColor: "neutral.c40",
  borderWidth: 1,
  borderRadius: 1,
})``;

const IconContainer: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(BorderFlex).attrs({
  width: 48,
  height: 48,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
})``;

const Row: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "flex-start",
})``;

const Column: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
})``;

type BulletProps = FlexBoxProps & {
  status: Status;
  bulletText?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode | null;
};

export const Bullet = ({
  status,
  bulletText,
  title,
  subtitle,
  children,
  ...props
}: BulletProps) => {
  return (
    <Row {...props} alignItems={children ? "flex-start" : "center"}>
      <IconContainer>
        {status === Status.active ? (
          <InfiniteLoader color="primary.c60" size={20} />
        ) : status === Status.completed ? (
          <Icons.CheckTickMedium size={24} color="success.c70" />
        ) : status === Status.updateAvailable ? (
          <Icons.InfoAltFillMedium size={20} color="primary.c80" />
        ) : status === Status.failed ? (
          <Icons.CircledCrossSolidMedium size={20} color="error.c50" />
        ) : status === Status.cancelled ? (
          <Icons.WarningSolidMedium size={20} color="warning.c60" />
        ) : (
          <Text variant="body">{bulletText}</Text>
        )}
      </IconContainer>
      <Column flex="1" ml={7} rowGap={2}>
        <Text variant="body" fontWeight="semiBold" whiteSpace="pre-wrap">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="paragraph" color="neutral.c80" whiteSpace="pre-wrap">
            {subtitle}
          </Text>
        ) : null}
        {children ? <Flex mt={7}>{children}</Flex> : null}
      </Column>
    </Row>
  );
};
