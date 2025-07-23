import { Box } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";

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

export const IconContainer = ({ icon }: { icon: React.ReactNode }) => <Container>{icon}</Container>;
