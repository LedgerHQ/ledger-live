import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import Tooltip from "~/renderer/components/Tooltip";
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

  return (
    <div className="flex items-center gap-12">
      <Tooltip content={tooltip} placement="bottom" onShow={onTooltipShow}>
        <IconButton
          appearance="gray"
          size="sm"
          aria-label={label}
          icon={icon}
          onClick={onClick}
          data-testid={testId}
          disabled={!isInteractive}
        />
      </Tooltip>
    </div>
  );
}
