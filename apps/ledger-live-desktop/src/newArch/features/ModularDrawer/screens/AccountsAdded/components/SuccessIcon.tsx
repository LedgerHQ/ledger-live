import React from "react";
import styled from "styled-components";
import { Box, Icons } from "@ledgerhq/react-ui";

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

export const SuccessIcon = () => (
  <Container>
    <Icons.CheckmarkCircleFill size="L" color="success.c60" />
  </Container>
);
