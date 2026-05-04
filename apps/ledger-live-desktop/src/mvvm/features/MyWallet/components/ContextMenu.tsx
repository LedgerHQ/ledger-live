import React, { useCallback, useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent, IconButton } from "@ledgerhq/lumen-ui-react";
import { Airplane } from "@ledgerhq/lumen-ui-react/symbols";
import { Explore } from "./Explore";
import TopBar from "./TopBar";
import { ActionsList } from "./ActionsList";
import { MyLedger } from "./MyLedger";
import ContextMenuContext from "./ContextMenuContext";

const side = "bottom";
const align = "end";

export function ContextMenu() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const contextValue = useMemo(() => ({ close }), [close]);

  return (
    <Popover overlay open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<IconButton icon={Airplane} aria-label="Airplane" size="sm" />} />

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
