import React from "react";
import { Popover, PopoverTrigger, PopoverContent, IconButton } from "@ledgerhq/lumen-ui-react";
import { Airplane } from "@ledgerhq/lumen-ui-react/symbols";
import { Explore } from "./Explore";
import TopBar from "./TopBar";
import { ActionsList } from "./ActionsList";

const side = "bottom";
const align = "end";

export function ContextMenu() {
  return (
    <Popover>
      <PopoverTrigger render={<IconButton icon={Airplane} aria-label="Airplane" size="sm" />} />

      <PopoverContent
        width="fixed"
        side={side}
        align={align}
        className="flex flex-col bg-surface gap-24"
      >
        <TopBar />
        <ActionsList />
        <Explore />
      </PopoverContent>
    </Popover>
  );
}
