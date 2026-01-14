import { Box } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c10};
  border-radius: 32px;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
`;

export const IconContainer = ({ icon }: { icon: React.ReactNode }) => <Container>{icon}</Container>;
