import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import Tooltip from "~/renderer/components/Tooltip";
import type { TopBarAction } from "../types";

type TopBarActionButtonProps = TopBarAction & {
  /** Override the default test id derived from label (e.g. "topbar-action-button-notifications") */
  "data-testid"?: string;
};

export function TopBarActionButton({
  label,
  tooltip,
  isInteractive,
  onClick,
  icon,
  "data-testid": dataTestId,
}: TopBarActionButtonProps) {
  const testId = dataTestId ?? `topbar-action-button-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex items-center gap-12">
      <Tooltip content={tooltip} placement="bottom">
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
