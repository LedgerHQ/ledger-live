import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";

export function LabelWithInfo({ label, info }: Readonly<{ label: string; info: string }>) {
  return (
    <span className="flex items-center gap-4">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="inline-flex cursor-help border-0 bg-transparent p-0"
          >
            <Information size={16} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{info}</TooltipContent>
      </Tooltip>
    </span>
  );
}
