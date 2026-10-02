import React from "react";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  InteractiveIcon,
  Tag,
} from "@ledgerhq/lumen-ui-rnative";
import { Copy } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoTooltip } from "../InfoTooltip/InfoTooltip";
import type { DetailRowProps } from "./types";

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
          <InfoTooltip
            title={row.label}
            description={row.infoLabel}
            testID={`card-transaction-detail-info-${row.id}`}
          />
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
