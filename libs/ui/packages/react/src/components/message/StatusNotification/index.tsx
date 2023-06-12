import React from "react";
import styled from "styled-components";
import FlexBox, { FlexBoxProps } from "../../layout/Flex";
import Log from "../Log/";

interface ContainerProps extends FlexBoxProps {
  /* Add the pre-selected border. */
  hasBorder?: boolean;
}

export interface Props extends ContainerProps {
  /* The text to be displayed. */
  text: string;
  /* JSX that should be rendered on top of the Notification.*/
  badge: React.ReactNode;
}

const Container = styled(FlexBox).attrs<ContainerProps>({
  p: 8,
  rowGap: 9,
  alignItems: "center",
  flexDirection: "column",
})<ContainerProps>`
  border-width: 1px;
  border-style: ${p => (p.hasBorder ? "solid" : "none")};
  border-radius: 8px;
  border-color: ${p => p.theme.colors.neutral.c40};
`;

function StatusNotification({
  text,
  badge,
  hasBorder = false,
  ...containerProps
}: Props): JSX.Element {
  return (
    <Container hasBorder={hasBorder} {...containerProps}>
      {badge}
      <Log>{text}</Log>
    </Container>
  );
}

export default StatusNotification;
