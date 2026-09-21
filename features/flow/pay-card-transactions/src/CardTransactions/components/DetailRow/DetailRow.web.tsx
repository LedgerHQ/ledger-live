import React from "react";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  InteractiveIcon,
  Tag,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Copy, Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { DetailRowProps } from "./types";

export function DetailRow({ row }: DetailRowProps) {
  return (
    <DescriptionItem size="md" data-testid={`card-transaction-detail-row-${row.id}`}>
      <DescriptionItemLeading>
        <DescriptionItemLabel>{row.label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <div className="flex items-center gap-8">
          {row.statusAppearance ? (
            <Tag appearance={row.statusAppearance} size="sm" label={row.value} />
          ) : (
            <DescriptionItemValue>{row.value}</DescriptionItemValue>
          )}
          {row.infoLabel ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <InteractiveIcon
                  iconType="filled"
                  size={16}
                  icon={Information}
                  aria-label={row.infoLabel}
                  data-testid="card-transaction-detail-card-info"
                  appearance="base"
                />
              </TooltipTrigger>
              <TooltipContent>{row.infoLabel}</TooltipContent>
            </Tooltip>
          ) : null}
          {row.copyLabel && row.onCopy ? (
            <InteractiveIcon
              iconType="filled"
              icon={Copy}
              size={16}
              onClick={row.onCopy}
              aria-label={row.copyLabel}
              data-testid="card-transaction-detail-copy"
              appearance="base"
            />
          ) : null}
        </div>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}
