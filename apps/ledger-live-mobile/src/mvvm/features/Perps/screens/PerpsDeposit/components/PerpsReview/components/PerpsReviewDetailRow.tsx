import React from "react";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
} from "@ledgerhq/lumen-ui-rnative";

type PerpsReviewDetailRowProps = Readonly<{
  label: string;
  value: string;
  testID?: string;
}>;

export function PerpsReviewDetailRow({ label, value, testID }: PerpsReviewDetailRowProps) {
  return (
    <DescriptionItem size="md" testID={testID}>
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{value}</DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}
