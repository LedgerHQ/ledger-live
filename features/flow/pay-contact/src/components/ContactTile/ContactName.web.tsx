import React, { useCallback, useRef, useState } from "react";
import {
  TableCellContentTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";

type ContactNameProps = Readonly<{
  name: string;
}>;

export function ContactName({ name }: ContactNameProps) {
  const nameRef = useRef<HTMLDivElement>(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleTooltipOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setIsTooltipOpen(false);
      return;
    }

    const element = nameRef.current;
    setIsTooltipOpen(element !== null && element.scrollWidth > element.clientWidth);
  }, []);

  return (
    <Tooltip open={isTooltipOpen} onOpenChange={handleTooltipOpenChange}>
      <TooltipTrigger asChild>
        <TableCellContentTitle
          ref={nameRef}
          className="min-w-0 shrink truncate"
          data-testid="pay-contacts-name"
        >
          {name}
        </TableCellContentTitle>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
