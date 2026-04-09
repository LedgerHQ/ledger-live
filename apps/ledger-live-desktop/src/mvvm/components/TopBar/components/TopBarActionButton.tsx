import React, { useCallback } from "react";
import {
  Button,
  IconButton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@ledgerhq/lumen-ui-react";
import type { TopBarAction } from "../types";

type TopBarActionButtonProps = TopBarAction;

export function TopBarActionButton({
  label,
  tooltip,
  tooltipClassName,
  isInteractive,
  onClick,
  icon,
  appearance = "gray",
  onTooltipShow,
  cta,
}: TopBarActionButtonProps) {
  const testId = `topbar-action-button-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) onTooltipShow?.();
    },
    [onTooltipShow],
  );

  const button = cta ? (
    <Button
      appearance={appearance}
      size="sm"
      icon={icon}
      onClick={onClick}
      data-testid={testId}
      disabled={!isInteractive}
      className="rounded-full"
    >
      {cta}
    </Button>
  ) : (
    <IconButton
      appearance={appearance}
      size="sm"
      aria-label={label}
      icon={icon}
      onClick={onClick}
      data-testid={testId}
      disabled={!isInteractive}
    />
  );

  return (
    <div className="flex items-center gap-12">
      <Tooltip onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        {tooltip && (
          <TooltipContent side="bottom" className={tooltipClassName}>
            {tooltip}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
