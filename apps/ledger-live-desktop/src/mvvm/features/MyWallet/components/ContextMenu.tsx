import React from "react";
import { Popover, PopoverTrigger, PopoverContent, IconButton } from "@ledgerhq/lumen-ui-react";
import { Airplane } from "@ledgerhq/lumen-ui-react/symbols";

const side = "bottom";
const align = "end";

export function ContextMenu() {
  return (
    <Popover>
      <PopoverTrigger render={<IconButton icon={Airplane} aria-label="Airplane" size="sm" />} />

      <PopoverContent width="fixed" side={side} align={align}>
        <p className="body-2 text-base">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.
        </p>
      </PopoverContent>
    </Popover>
  );
}
