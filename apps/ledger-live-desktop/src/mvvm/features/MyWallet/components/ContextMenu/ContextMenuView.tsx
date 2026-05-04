import React from "react";
import { Popover, PopoverContent } from "@ledgerhq/lumen-ui-react";
import { ActionsList } from "../ActionsList";
import { MyLedger } from "../MyLedger";
import ContextMenuContext from "../ContextMenuContext";
import { ContextMenuTrigger } from "../ContextMenuTrigger";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";
import TopBar from "../TopBar";
import { Explore } from "../Explore";
import { ContextMenuViewProps } from "./types";
import TrackPage from "~/renderer/analytics/TrackPage";

const side = "bottom";
const align = "end";

export function ContextMenuView({ open, onOpenChange, contextValue }: ContextMenuViewProps) {
  return (
    <Popover overlay open={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger />

      <PopoverContent width="fixed" side={side} align={align} className="flex flex-col gap-24">
        <ContextMenuContext.Provider value={contextValue}>
          <TrackPage category={MY_WALLET_TRACKING_PAGE_NAME} />
          <TopBar />
          <ActionsList />
          <div className="flex flex-col gap-12">
            <MyLedger />
            <Explore />
          </div>
        </ContextMenuContext.Provider>
      </PopoverContent>
    </Popover>
  );
}
