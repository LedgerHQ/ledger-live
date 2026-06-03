import React from "react";
import {
  DescriptionItem,
  DescriptionItemLeading,
  DescriptionItemLabel,
  DescriptionItemTrailing,
  DescriptionItemValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";

export type StatRowProps = Readonly<{
  label: string;
  value: string;
  tooltip?: string;
  onTooltipOpenChange?: (open: boolean) => void;
}>;

export function StatRow({ label, value, tooltip, onTooltipOpenChange }: StatRowProps) {
  return (
    <DescriptionItem size="md">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
        {tooltip && (
          <Tooltip onOpenChange={onTooltipOpenChange}>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-help text-muted" aria-label={label}>
                <Information size={16} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{value}</DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}
