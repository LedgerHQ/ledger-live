import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";

type Props = Readonly<React.ComponentProps<"input"> & { icon?: React.ReactNode }>;

const Wrapper = styled.div`
  ${withTokens(
    "spacing-s",
    "spacing-xxs",
    "radius-s",
    "colors-surface-transparent-subdued-default",
    "colors-content-subdued-default-default",
  )}

  display: flex;
  height: 40px;
  min-width: 328px;
  padding: 0px var(--spacing-s, 16px);
  align-items: center;
  gap: var(--spacing-xxs, 8px);

  border-radius: var(--radius-s, 8px);
  background: var(--colors-surface-transparent-subdued-default, rgba(0, 0, 0, 0.03));
  color: var(--colors-content-subdued-default-default);
  overflow: hidden;
`;

const StyledInput = styled.input`
  background: none;
  cursor: text;
  border: none;
  width: 100%;
`;

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ type = "text", icon = null, ...props }, ref) => {
    return (
      <Wrapper>
        {icon}
        <StyledInput {...props} type={type} ref={ref} />
      </Wrapper>
    );
  },
);
Input.displayName = "Input";
