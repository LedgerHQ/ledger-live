import React, { ReactNode } from "react";
import { Text } from "../../../components";
import { withTokens } from "../../libs";
import styled from "styled-components";

const Wrapper = styled.div`
  ${withTokens(
    "colors-surface-transparent-subdued-default",
    "colors-content-subdued-default-default",
    "radius-xs",
    "spacing-xxxs",
  )}

  padding: 1px var(--spacing-xxxs);
  border-radius: var(--radius-xs);
  display: inline-flex;
  background-color: var(--colors-surface-transparent-subdued-default);
  flex-shrink: 0;
`;

export const Tag = ({
  textTransform = "none",
  children,
}: {
  textTransform?: string;
  children: ReactNode;
}) => {
  return (
    <Wrapper data-testid="tag">
      <Text
        color="var(--colors-content-subdued-default-default)"
        fontSize="10px"
        lineHeight="16px"
        textTransform={textTransform}
      >
        {children}
      </Text>
    </Wrapper>
  );
};
