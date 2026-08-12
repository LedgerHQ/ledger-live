import React, { useCallback, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";

type ContactDetailNameProps = Readonly<{
  name: string;
}>;

export function ContactDetailName({ name }: ContactDetailNameProps): React.JSX.Element {
  const nameRef = useRef<HTMLHeadingElement>(null);
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
        <h2
          ref={nameRef}
          className="heading-3-semi-bold min-w-0 max-w-full truncate text-base"
          data-testid="contacts-detail-name"
        >
          {name}
        </h2>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
