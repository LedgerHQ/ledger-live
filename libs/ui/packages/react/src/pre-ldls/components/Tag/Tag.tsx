import React, { ReactNode } from "react";
import { Text } from "../../../components";
import { withTokens } from "../../libs";
import styled from "styled-components";

const Wrapper = styled.div`
  ${withTokens(
    "colors-surface-transparent-subdued-default",
    "colors-content-subdued-default-default",
    "radius-xs",
  )}

  padding-left: 6px; // Check this
  padding-right: 6px; // Check this
  padding-top: 4px; // Check this
  padding-bottom: 4px; // Check this

  border-radius: var(--radius-xs);
  display: inline-flex;
  background-color: var(--colors-surface-transparent-subdued-default);
`;

export const Tag = ({ children }: { children: ReactNode }) => {
  return (
    <Wrapper data-testid="tag">
      <Text color="var(--colors-content-subdued-default-default)" fontSize="10px">
        {children}
      </Text>
    </Wrapper>
  );
};
