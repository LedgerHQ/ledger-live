import React, { useCallback } from "react";
import { IconButton, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-react";
import type { TopBarAction } from "../types";

type TopBarActionButtonProps = TopBarAction;

export function TopBarActionButton({
  label,
  tooltip,
  isInteractive,
  onClick,
  icon,
  onTooltipShow,
}: TopBarActionButtonProps) {
  const testId = `topbar-action-button-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) onTooltipShow?.();
    },
    [onTooltipShow],
  );

  return (
    <div className="flex items-center gap-12">
      <Tooltip onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <IconButton
            appearance="gray"
            size="sm"
            aria-label={label}
            icon={icon}
            onClick={onClick}
            data-testid={testId}
            disabled={!isInteractive}
          />
        </TooltipTrigger>
        {tooltip && <TooltipContent side="bottom">{tooltip}</TooltipContent>}
      </Tooltip>
    </div>
  );
}
