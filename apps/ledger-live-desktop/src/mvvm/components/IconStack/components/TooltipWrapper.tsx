import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";

type TooltipWrapperProps = {
  readonly tooltipContent: string;
  readonly children: React.ReactElement;
};

export function TooltipWrapper({ tooltipContent, children }: TooltipWrapperProps) {
  if (tooltipContent.length === 0) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}
