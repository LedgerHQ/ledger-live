import React, { type ReactNode } from "react";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
} from "@ledgerhq/lumen-ui-react";

export function PositionRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <DescriptionItem>
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>{children}</DescriptionItemTrailing>
    </DescriptionItem>
  );
}
