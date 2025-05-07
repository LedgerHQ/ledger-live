import React from "react";
import { withTokens } from "../../libs";
import styled from "styled-components";

const Button = styled.button`
  ${withTokens(
    "colors-border-subdued-default-default",
    "colors-content-default-default",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
    "colors-border-focus-default",
    "radius-s",
    "border-width-default",
    "border-width-focus",
    "spacing-xs",
  )}

  display: flex;
  padding: var(--spacing-xs);
  flex-grow: 1;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;

  background-color: transparent;
  color: var(--colors-content-default-default);

  border-width: var(--border-width-default);
  border-radius: var(--radius-s);
  border-color: var(--colors-border-subdued-default-default);

  :hover {
    background-color: var(--colors-surface-transparent-hover);
  }

  :active {
    background-color: var(--colors-surface-transparent-pressed);
  }

  :focus-visible {
    border-color: var(--colors-border-focus-default);
    border-width: var(--border-width-focus);
  }
`;

export const CardButton = ({
  onClick,
  title,
  iconRight,
  variant = "default",
}: {
  onClick: () => void;
  title: string;
  iconRight?: JSX.Element;
  variant?: "default" | "dashed";
}) => {
  return (
    <Button onClick={onClick} style={{ borderStyle: variant === "default" ? "solid" : "dashed" }}>
      {title} {iconRight}
    </Button>
  );
};
