import React, { memo, useCallback } from "react";
import styled from "styled-components";
import AngleUp from "~/renderer/icons/AngleUp";

interface ScrollUpButtonProps {
  readonly isVisible: boolean;
  readonly onClick: () => void;
}

const StyledButton = styled.button.attrs<{ $isVisible: boolean }>(p => ({
  style: {
    opacity: p.$isVisible ? 1 : 0,
    pointerEvents: p.$isVisible ? "initial" : "none",
  },
}))<{ $isVisible: boolean }>`
  position: absolute;
  z-index: 10;
  bottom: 100px;
  right: 20px;
  border-radius: 50%;
  box-shadow: 0 2px 4px 0 rgba(102, 102, 102, 0.25);
  cursor: pointer;
  height: 36px;
  width: 36px;
  border: none;
  color: ${p => p.theme.colors.neutral.c00};
  background-color: ${p => p.theme.colors.primary.c80};
  transition: all 0.5s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary.c60};
    outline-offset: 2px;
  }
`;

/**
 * Scroll Up Button
 * Floating button to scroll back to top of the page
 */
export const ScrollUpButton = memo(function ScrollUpButton({
  isVisible,
  onClick,
}: ScrollUpButtonProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <StyledButton
      type="button"
      aria-label="Scroll to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      $isVisible={isVisible}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <AngleUp size={20} />
    </StyledButton>
  );
});
