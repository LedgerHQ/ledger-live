import React, { useCallback, useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@ledgerhq/lumen-ui-react";
import { Explore } from "./Explore";
import TopBar from "./TopBar";
import { ActionsList } from "./ActionsList";
import { MyLedger } from "./MyLedger";
import ContextMenuContext from "./ContextMenuContext";
import { UserAvatar } from "./UserAvatar";

const side = "bottom";
const align = "end";

export function ContextMenu() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const contextValue = useMemo(() => ({ close }), [close]);

  return (
    <Popover overlay open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            aria-label="My wallet"
            className="cursor-pointer items-center justify-center rounded-full hover:bg-muted-hover"
          >
            <UserAvatar />
          </button>
        }
      />

      <PopoverContent width="fixed" side={side} align={align} className="flex flex-col gap-24">
        <ContextMenuContext.Provider value={contextValue}>
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
