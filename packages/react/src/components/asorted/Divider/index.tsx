import React from "react";
import styled from "styled-components";

const Divider = styled.div`
  display: block;
  background: ${(p) => p.theme.colors.neutral.c90};
  height: 1px;

  &[data-variant="light"] {
    background: ${(p) => p.theme.colors.neutral.c40};
  }
`;

export type Props = { variant: "default" | "light" };

export default ({ variant = "default" }: Props) => <Divider data-variant={variant} />;
