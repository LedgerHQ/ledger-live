import React from "react";
import { Popover, PopoverContent } from "@ledgerhq/lumen-ui-react";
import ContextMenuContext from "../ContextMenuContext";
import { ContextMenuTrigger } from "../ContextMenuTrigger";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";
import { ContextMenuTransition } from "./ContextMenuTransition";
import { CONTEXT_MENU_REGISTRY } from "./registry";
import type { ContextMenuViewProps } from "./types";
import TrackPage from "~/renderer/analytics/TrackPage";

const side = "bottom";
const align = "end";

export function ContextMenuView({
  open,
  onOpenChange,
  contextValue,
}: Readonly<ContextMenuViewProps>) {
  const { view, direction } = contextValue;
  const Screen = CONTEXT_MENU_REGISTRY[view];

  return (
    <Popover overlay open={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger />

      <PopoverContent width="fixed" side={side} align={align} className="overflow-hidden">
        <ContextMenuContext.Provider value={contextValue}>
          <TrackPage category={MY_WALLET_TRACKING_PAGE_NAME} />
          <ContextMenuTransition view={view} direction={direction}>
            <Screen />
          </ContextMenuTransition>
        </ContextMenuContext.Provider>
      </PopoverContent>
    </Popover>
  );
}
