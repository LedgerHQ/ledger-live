import React from "react";
import {
  TableCellContent,
  TableCellContentTitle,
  TableCellContentDescription,
} from "@ledgerhq/lumen-ui-react";

type OperationCounterpartyCellViewProps = {
  readonly displayName: string;
  readonly contactAddressLabel?: string;
  readonly prefix?: string;
  readonly children?: React.ReactNode;
};

export const OperationCounterpartyCellView = ({
  displayName,
  contactAddressLabel,
  prefix,
  children,
}: OperationCounterpartyCellViewProps) => (
  <TableCellContent>
    <TableCellContentTitle>
      <div className="inline-flex items-center gap-4">
        {displayName ? (
          <>
            {prefix ? <span className="text-neutral-c80">{prefix}</span> : null}
            <span>{displayName}</span>
          </>
        ) : null}
        {children}
      </div>
    </TableCellContentTitle>
    {contactAddressLabel ? (
      <TableCellContentDescription>{contactAddressLabel}</TableCellContentDescription>
    ) : null}
  </TableCellContent>
);
