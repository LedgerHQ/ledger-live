import React, { memo } from "react";
import { ChevronUp } from "@ledgerhq/lumen-ui-react/symbols";
import { IconButton } from "@ledgerhq/lumen-ui-react";

interface ScrollUpButtonProps {
  readonly isVisible: boolean;
  readonly onClick: () => void;
}

/**
 * Scroll Up Button
 * Floating button to scroll back to top of the page
 */
export const ScrollUpButton = memo(function ScrollUpButton({
  onClick,
  isVisible,
}: ScrollUpButtonProps) {
  return (
    <div
      className={`fixed right-20 bottom-[100px] transition-all duration-500 ${isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <IconButton
        icon={ChevronUp}
        onClick={onClick}
        size="md"
        appearance="base"
        data-testid="scroll-up-button"
        aria-label="Scroll to top"
      />
    </div>
  );
});
