import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { TopBarAction } from "../types";
import { TopBarDivider } from "./Divider";
import Tooltip from "~/renderer/components/Tooltip";

export const TopBarActionsList = ({ actionsList }: { actionsList: TopBarAction[] }) => (
  <div className="flex items-center gap-12" data-testid="top-bar-actions-list">
    {actionsList.map(({ label, tooltip, isInteractive, onClick, icon }) => {
      return (
        <div key={label} className="flex items-center gap-12">
          <Tooltip content={tooltip} placement="bottom">
            <IconButton
              appearance="gray"
              size="sm"
              aria-label={label}
              icon={icon}
              onClick={onClick}
              data-testid={`topbar-action-button-${label.replace(/\s+/g, "-").toLowerCase()}`}
              disabled={!isInteractive}
            />
          </Tooltip>
          <TopBarDivider />
        </div>
      );
    })}
  </div>
);
