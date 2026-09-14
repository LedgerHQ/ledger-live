import React from "react";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  InteractiveIcon,
  Tag,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-rnative";
import { Copy, Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CardTransactionDetailRow } from "./types";

export type DetailRowProps = Readonly<{
  row: CardTransactionDetailRow;
}>;

export function DetailRow({ row }: DetailRowProps) {
  return (
    <DescriptionItem size="md" testID={`card-transaction-detail-row-${row.id}`}>
      <DescriptionItemLeading>
        <DescriptionItemLabel>{row.label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        {row.statusAppearance ? (
          <Tag appearance={row.statusAppearance} size="sm" label={row.value} />
        ) : (
          <DescriptionItemValue>{row.value}</DescriptionItemValue>
        )}
        {row.infoLabel ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <InteractiveIcon
                icon={Information}
                size={16}
                iconType="stroked"
                accessibilityLabel={row.infoLabel}
                testID="card-transaction-detail-card-info"
                appearance="base"
              />
            </TooltipTrigger>
            <TooltipContent
              title={row.label}
              content={
                <Text typography="body1" lx={{ color: "base" }}>
                  {row.infoLabel}
                </Text>
              }
            />
          </Tooltip>
        ) : null}
        {row.copyLabel && row.onCopy ? (
          <InteractiveIcon
            icon={Copy}
            iconType="stroked"
            size={16}
            accessibilityLabel={row.copyLabel}
            testID="card-transaction-detail-copy"
            onPress={row.onCopy}
            appearance="base"
          />
        ) : null}
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}
