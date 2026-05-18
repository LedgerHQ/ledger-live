import type { CSSProperties, ReactNode } from "react";
import { CardContentDescription, CardContentTitle } from "@ledgerhq/lumen-ui-react";

type PnlFooterStatRowProps = Readonly<{
  label: ReactNode;
  value: ReactNode;
  valueTone?: CSSProperties;
}>;

export function PnlFooterStatRow({ label, value, valueTone }: PnlFooterStatRowProps) {
  return (
    <div className="flex w-full min-w-0 items-baseline justify-between gap-16">
      <CardContentDescription className="truncate">{label}</CardContentDescription>
      <CardContentTitle className="truncate text-end" style={valueTone}>
        {value}
      </CardContentTitle>
    </div>
  );
}
