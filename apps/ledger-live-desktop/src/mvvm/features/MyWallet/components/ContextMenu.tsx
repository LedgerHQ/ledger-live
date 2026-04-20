import React from "react";
import { Popover, PopoverTrigger, PopoverContent, IconButton } from "@ledgerhq/lumen-ui-react";
import { Airplane } from "@ledgerhq/lumen-ui-react/symbols";
import { Explore } from "./Explore";
import TopBar from "./TopBar";
import { ActionsList } from "./ActionsList";
import { MyLedger } from "./MyLedger";

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
        <div className="flex flex-col gap-12">
          <MyLedger />
          <Explore />
        </div>
      </PopoverContent>
    </Popover>
  );
}
