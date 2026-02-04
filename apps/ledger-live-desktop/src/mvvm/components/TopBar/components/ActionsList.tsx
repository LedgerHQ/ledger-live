import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { TopBarAction } from "../types";
import { TopBarDivider } from "./Divider";
import Tooltip from "~/renderer/components/Tooltip";

export const TopBarActionsList = ({ actionsList }: { actionsList: TopBarAction[] }) => {
  return (
    <div className="flex items-center" data-testid="top-bar-actions-list">
      {actionsList.map(({ label, tooltip, icon, isInteractive, onClick }, index) => (
        <div key={index} className="flex items-center gap-12">
          <Tooltip content={tooltip} placement="bottom">
            <IconButton
              appearance="gray"
              size="sm"
              icon={icon}
              aria-label={label}
              onClick={onClick}
              disabled={!isInteractive}
              data-testid={`topbar-action-button-${label.replace(/\s+/g, "-").toLowerCase()}`}
            />
          </Tooltip>
          <TopBarDivider />
        </div>
      ))}
    </div>
  );
};
